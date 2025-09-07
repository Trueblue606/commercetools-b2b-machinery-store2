// src/pages/api/products-by-category.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const {
    // Either send a categoryId...
    categoryId,
    // ...or a full CT where-clause (raw or already-encoded; we normalize it)
    where,
    priceCurrency = "GBP",
    priceCountry = "GB",
    priceCustomerGroup,     // UUID id
    priceCustomerGroupKey,  // optional: key -> resolve to UUID
    staged,                 // "true" to preview unpublished
  } = req.query;

  try {
    const { getCTToken } = await import("@/lib/ctAuth");
    const { API, ctGet } = await import("@/lib/ct-rest");

    // ---- token (supports string or object return) ----
    const rawToken = await getCTToken();
    const accessToken = typeof rawToken === "string" ? rawToken : rawToken?.access_token || rawToken?.token;
    if (!accessToken) return res.status(500).json({ error: "No valid CT token" });

    // ---- resolve customer group (id or key) ----
    let groupId = (priceCustomerGroup || "").trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!groupId && priceCustomerGroupKey) {
      const safeKey = String(priceCustomerGroupKey).replace(/"/g, '\\"');
      const cg = await ctGet(`/customer-groups?where=key="${safeKey}"&limit=1`, accessToken);
      groupId = cg?.results?.[0]?.id || "";
      if (!groupId) return res.status(400).json({ error: `Customer group not found for key "${priceCustomerGroupKey}"` });
    }
    if (groupId && !uuidRe.test(groupId)) {
      return res.status(400).json({ error: "priceCustomerGroup must be a UUID (or provide priceCustomerGroupKey)" });
    }

    // ---- build where (avoid double-encoding) ----
    let whereClause;
    if (where && String(where).trim()) {
      const first = Array.isArray(where) ? where[0] : String(where);
      // If already encoded, try to decode once; if it wasn't, decode will just error and we fall back.
      try { whereClause = decodeURIComponent(first); } catch { whereClause = first; }
    } else if (categoryId) {
      whereClause = `categories(id="${categoryId}")`;
    } else {
      return res.status(400).json({ error: "Provide either categoryId or where" });
    }

    // ---- query params (let URLSearchParams do the encoding ONCE) ----
    const qs = new URLSearchParams();
    qs.append("where", whereClause);
    qs.set("limit", "100");
    if (priceCurrency) qs.set("priceCurrency", String(priceCurrency));
    if (priceCountry) qs.set("priceCountry", String(priceCountry));
    if (groupId) qs.set("priceCustomerGroup", groupId);
    if (String(staged).toLowerCase() === "true") qs.set("staged", "true");

    const url = API(`/product-projections?${qs.toString()}`);

    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: "Failed to fetch products", detail: errText });
    }

    const data = await resp.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    // ---- normalize for PLP (what category flow expects) ----
    const products = results.map((p) => ({
      id: p.id,
      name: p.name?.["en-GB"] || p.name?.["en"] || "No name",
      sku: p.masterVariant?.sku || "",
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
    }));

    // Return BOTH shapes so both callers work:
    // - category flow expects { products }
    // - selection flow currently reads raw { results }
    return res.status(200).json({ ok: true, products, results });
  } catch (error) {
    console.error("products-by-category error:", error);
    return res.status(500).json({ error: "Failed to fetch products", detail: error?.message });
  }
}