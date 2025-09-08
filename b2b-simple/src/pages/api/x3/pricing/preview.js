// src/pages/api/x3/pricing/preview.js
import { getCTToken } from "@/lib/ctAuth";
// Be defensive about export shapes from ct-rest
import * as ct from "@/lib/ct-rest";
const ctGet =
  ct.ctGet || ct.get || (ct.default && (ct.default.ctGet || ct.default.get));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");

  if (!ctGet) {
    return res.status(500).json({
      ok: false,
      error: "ct-rest: ctGet/get export not found. Check lib/ct-rest.js exports.",
    });
  }

  try {
    const token = await getCTToken();

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const changes = Array.isArray(body) ? body : (Array.isArray(body.changes) ? body.changes : []);

    const preview = [];
    for (const c of changes) {
      const sku = c?.sku;
      if (!sku) {
        preview.push({ ...c, error: "Missing sku" });
        continue;
      }

      const encSku = encodeURIComponent(sku);
      const proj = await ctGet(`/product-projections/search?staged=true&filter=variants.sku:"${encSku}"`, token);
      const product = proj?.results?.[0] || null;

      const variant =
        [product?.masterVariant, ...(product?.variants || [])].find(v => v?.sku === sku) || null;

      preview.push({
        ...c,
        productId: product?.id || null,
        productKey: product?.key || null,
        variantId: variant?.id || null,
        currentEmbeddedPrices: variant?.prices || [],
      });
    }

    return res.status(200).json({ ok: true, count: preview.length, preview });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}