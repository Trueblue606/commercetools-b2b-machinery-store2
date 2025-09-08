// src/pages/api/search.js
// Full-text search over product projections with price selection.
// Falls back to a substring match (name/slug/SKU) if CT full-text returns 0.
// Always returns JSON.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const {
      q,                       // search text
      limit = 50,
      priceCurrency = "GBP",
      priceCountry = "GB",
      priceCustomerGroup,      // UUID id (optional)
      priceCustomerGroupKey,   // optional: resolve key -> id
      staged,                  // "true" to read staged
    } = req.query;

    const { getCTToken } = await import("@/lib/ctAuth");
    const { API, ctGet } = await import("@/lib/ct-rest");

    // token (supports string or object)
    const raw = await getCTToken();
    const accessToken = typeof raw === "string" ? raw : (raw?.access_token || raw?.token);
    if (!accessToken) return res.status(500).json({ ok: false, error: "No valid CT token" });

    // resolve customer group: id or key
    let groupId = (priceCustomerGroup || "").trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!groupId && priceCustomerGroupKey) {
      const safeKey = String(priceCustomerGroupKey).replace(/"/g, '\\"');
      const cg = await ctGet(`/customer-groups?where=key="${safeKey}"&limit=1`, accessToken);
      groupId = cg?.results?.[0]?.id || "";
      if (!groupId) {
        return res.status(400).json({ ok: false, error: `Customer group not found for key "${priceCustomerGroupKey}"` });
      }
    }
    if (groupId && !uuidRe.test(groupId)) {
      return res.status(400).json({ ok: false, error: "priceCustomerGroup must be a UUID (or provide priceCustomerGroupKey)" });
    }

    // empty query → empty results (avoid massive pulls)
    if (!q || !String(q).trim()) {
      return res.status(200).json({ ok: true, results: [], products: [] });
    }

    // ---------- 1) Try CT full-text search ----------
    const searchQs = new URLSearchParams();
    searchQs.set("text.en-GB", String(q));     // full-text
    searchQs.set("fuzzy", "true");
    searchQs.set("markMatchingVariants", "true");
    searchQs.set("limit", String(limit));
    if (priceCurrency) searchQs.set("priceCurrency", String(priceCurrency));
    if (priceCountry) searchQs.set("priceCountry", String(priceCountry));
    if (groupId) searchQs.set("priceCustomerGroup", groupId);
    if (String(staged).toLowerCase() === "true") searchQs.set("staged", "true");

    const searchUrl = API(`/product-projections/search?${searchQs.toString()}`);
    const sRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const sText = await sRes.text();
    let sJson;
    try { sJson = sText ? JSON.parse(sText) : {}; } catch { sJson = { raw: sText }; }

    let results = Array.isArray(sJson?.results) ? sJson.results : [];

    // ---------- 2) Fallback: substring contains on a small list ----------
    // CT full-text won't match "rodent" against "rodenticide". For demo/small catalogs,
    // fetch a page of projections and do a case-insensitive substring on name/slug/SKU.
    if (results.length === 0) {
      const listQs = new URLSearchParams();
      listQs.set("limit", "200"); // small demo-safe page
      if (priceCurrency) listQs.set("priceCurrency", String(priceCurrency));
      if (priceCountry) listQs.set("priceCountry", String(priceCountry));
      if (groupId) listQs.set("priceCustomerGroup", groupId);
      if (String(staged).toLowerCase() === "true") listQs.set("staged", "true");

      const listUrl = API(`/product-projections?${listQs.toString()}`);
      const lRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      const lText = await lRes.text();
      let lJson;
      try { lJson = lText ? JSON.parse(lText) : {}; } catch { lJson = { raw: lText }; }

      const all = Array.isArray(lJson?.results) ? lJson.results : [];
      const needle = String(q).toLowerCase();

      results = all.filter((p) => {
        const names = [
          p?.name?.["en-GB"],
          p?.name?.en,
          p?.slug?.["en-GB"],
          p?.slug?.en,
        ].filter(Boolean).map((s) => String(s).toLowerCase());

        const skus = [
          p?.masterVariant?.sku,
          ...(Array.isArray(p?.variants) ? p.variants.map((v) => v?.sku) : []),
        ].filter(Boolean).map((s) => String(s).toLowerCase());

        return [...names, ...skus].some((s) => s.includes(needle));
      }).slice(0, Number(limit) || 50);
    }

    // normalized list for your cards
    const products = results.map((p) => ({
      id: p.id,
      name: p.name?.["en-GB"] || p.name?.en || "No name",
      sku: p.masterVariant?.sku || "",
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
    }));

    return res.status(200).json({ ok: true, results, products });
  } catch (err) {
    console.error("search API error:", err);
    try {
      return res.status(500).json({ ok: false, error: "Search crashed", detail: String(err?.message || err) });
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: "Search crashed (fallback)" }));
    }
  }
}