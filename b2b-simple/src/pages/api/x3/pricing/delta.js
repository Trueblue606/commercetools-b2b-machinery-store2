/**
 * X3 Delta Importer (UK-only POC)
 * - Upserts an embedded price for (SKU, GB, GBP, customerGroupKey)
 * - Idempotent: changePrice if exists, addPrice otherwise
 * - Retries once on 409 (optimistic concurrency)
 *
 * Requires:
 *   - lib/ctAuth.js  -> getCTToken()
 *   - lib/ct-rest.js -> ctGet(path, token), ctPost(path, body, token)
 *
 * Env (typical):
 *   DEMO_DELTA_SECRET=changeme-demo
 *   CT_* (auth/api urls, creds, project key, scopes) already used by your libs
 */
import { getCTToken } from "@/lib/ctAuth";
import * as ct from "@/lib/ct-rest";
// tolerate different export styles from lib/ct-rest.js
const ctGet  = ct.ctGet  || ct.get  || (ct.default && (ct.default.ctGet  || ct.default.get));
const ctPost = ct.ctPost || ct.post || (ct.default && (ct.default.ctPost || ct.default.post));

const UK_ONLY_COUNTRY = "GB";
const UK_ONLY_CURRENCY = "GBP";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!ctGet || !ctPost) {
    return res.status(500).json({ error: "ct-rest exports not found. Ensure lib/ct-rest.js exports ctGet/ctPost (named or default)." });
  }

  // 1) Guard: demo secret (keep same header you used in Postman)
  const secret = req.headers["x-demo-secret"];
  const expected = process.env.DEMO_DELTA_SECRET || "changeme-demo";
  if (secret !== expected) return res.status(401).json({ error: "Invalid secret" });

  // 2) Parse body
  let deltas = req.body;
  if (!Array.isArray(deltas)) {
    try { deltas = JSON.parse(req.body || "[]"); } catch { /* ignore */ }
  }
  if (!Array.isArray(deltas) || deltas.length === 0) {
    return res.status(400).json({ error: "Empty delta list" });
  }

  // 3) Basic validation + UK-only enforcement
  const failures = [];
  const items = [];
  for (let i = 0; i < deltas.length; i++) {
    const d = deltas[i] || {};
    const required = ["sku", "customerGroupKey", "centAmount"];
    for (const k of required) {
      if (d[k] === undefined || d[k] === null || d[k] === "") {
        failures.push({ index: i, error: `Missing field: ${k}` });
        continue;
      }
    }
    const country = d.country || UK_ONLY_COUNTRY;
    const currency = d.currency || UK_ONLY_CURRENCY;
    if (country !== UK_ONLY_COUNTRY || currency !== UK_ONLY_CURRENCY) {
      failures.push({ index: i, error: "UK-only POC: require country=GB & currency=GBP" });
      continue;
    }
    items.push({
      sku: String(d.sku),
      customerGroupKey: String(d.customerGroupKey),
      centAmount: Number(d.centAmount),
      validFrom: d.validFrom || null,
      validUntil: d.validUntil || null,
      country,
      currency,
    });
  }
  if (items.length === 0) {
    return res.status(400).json({ error: "No valid items", failures });
  }

  // 4) CT token
  let token;
  try {
    token = await getCTToken();
  } catch (e) {
    return res.status(500).json({ error: "CT auth failed", detail: safeErr(e) });
  }

  // 5) Small helper fns
  const getCustomerGroupByKey = async (key) => {
    // GET /customer-groups/key={key}
    return ctGet(`/customer-groups/key=${encodeURIComponent(key)}`, token);
  };

  const findProductBySKU = async (sku) => {
    // 1) Use product-projections search (staged=true) with SKU filter
    //    This is the most reliable way to locate the product+variant by SKU.
    const enc = encodeURIComponent(sku);
    const proj = await ctGet(`/product-projections/search?staged=true&filter=variants.sku:"${enc}"`, token);
    const hit = proj?.results?.[0];
    if (!hit) return null;

    // 2) Identify the variantId that matches the SKU from the projection
    const allVariants = [hit.masterVariant, ...(hit.variants || [])];
    const found = allVariants.find(v => v?.sku === sku);
    if (!found?.id) return null;

    // 3) Fetch the canonical product to get CURRENT version for updates
    const full = await ctGet(`/products/${hit.id}`, token);
    return { id: full.id, version: full.version, variantId: found.id, product: full };
  };

  const pickExistingPrice = (variant, tuple) => {
    const prices = Array.isArray(variant?.prices) ? variant.prices : [];
    return prices.find(p =>
      p?.country === tuple.country &&
      p?.value?.currencyCode === tuple.currency &&
      ((p?.customerGroup?.id || "") === (tuple.customerGroupId || "")) &&
      !p?.channel // we are not using channels in POC
    );
  };

  const buildPriceDraft = (tuple) => {
    const draft = {
      value: { currencyCode: tuple.currency, centAmount: tuple.centAmount },
      country: tuple.country,
      customerGroup: { typeId: "customer-group", id: tuple.customerGroupId },
    };
    if (tuple.validFrom) draft.validFrom = tuple.validFrom;
    if (tuple.validUntil) draft.validUntil = tuple.validUntil;
    return draft;
  };

  const refreshProduct = async (id) => ctGet(`/products/${id}`, token);

  // 6) Process each delta (sequential is fine for POC; easy to batch later)
  const applied = [];
  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    try {
      // a) Resolve customer group
      const cg = await getCustomerGroupByKey(row.customerGroupKey);
      const customerGroupId = cg?.id;
      if (!customerGroupId) {
        failures.push({ index: i, error: `Customer group not found: ${row.customerGroupKey}` });
        continue;
      }

      // b) Resolve product + variant
      const prod = await findProductBySKU(row.sku);
      if (!prod) {
        failures.push({ index: i, error: `Product/variant not found for SKU ${row.sku}` });
        continue;
      }

      // c) Find if matching price already exists on that variant
      const currentVariant = getVariantFromCurrent(prod.product, prod.variantId);
      const tuple = {
        country: row.country,
        currency: row.currency,
        customerGroupId,
        centAmount: row.centAmount,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
      };
      const existing = pickExistingPrice(currentVariant, tuple);
      const priceDraft = buildPriceDraft(tuple);

      // d) Build update action
      let actions;
      if (existing) {
        actions = [{
          action: "changePrice",
          priceId: existing.id,
          price: priceDraft,
          staged: false,
        }];
      } else {
        actions = [{
          action: "addPrice",
          variantId: prod.variantId,
          price: priceDraft,
          staged: false,
        }];
      }

      // e) POST /products/{id} with version; retry once on 409
      let updated;
      try {
        updated = await ctPost(`/products/${prod.id}`, { version: prod.version, actions }, token);
      } catch (e) {
        const is409 = String(e?.status || e?.code || "").includes("409") ||
                      String(e?.message || "").includes("409");
        if (!is409) throw e;
        // refresh version and retry once
        const fresh = await refreshProduct(prod.id);
        updated = await ctPost(`/products/${prod.id}`, { version: fresh.version, actions }, token);
      }

      applied.push({
        sku: row.sku,
        customerGroupKey: row.customerGroupKey,
        action: existing ? "changePrice" : "addPrice",
        productId: updated.id,
        newVersion: updated.version,
      });
    } catch (e) {
      failures.push({ index: i, error: safeErr(e) });
    }
  }

  return res.status(200).json({
    ok: true,
    applied: applied.length,
    results: applied,
    failures,
  });
}

/** helpers **/
function escapeQuotes(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function safeErr(e) {
  if (!e) return "Unknown error";
  const out = { message: e.message || String(e) };
  if (e.body) out.body = e.body;
  if (e.status) out.status = e.status;
  if (e.code) out.code = e.code;
  return out;
}
function getVariantFromCurrent(product, variantId) {
  const current = product?.masterData?.current || {};
  if (current?.masterVariant?.id === variantId) return current.masterVariant;
  const arr = current?.variants || [];
  return arr.find(v => v?.id === variantId) || {};
}