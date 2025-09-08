export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing product id in query" });

  try {
    const { ctGet } = await import("@/lib/ct-rest");

    // Build price selection (GBP/GB + optional customer group from cookie or query)
    const sp = new URLSearchParams();
    sp.set("staged", "true");              // show deltas before publish
    sp.set("priceCurrency", "GBP");
    sp.set("priceCountry", "GB");

    const groupId =
      req.cookies?.customerGroupId ||
      (typeof req.query.priceCustomerGroup === "string" ? req.query.priceCustomerGroup : "");
    if (groupId) sp.set("priceCustomerGroup", groupId);

    const product = await ctGet(`/product-projections/${encodeURIComponent(id)}?${sp.toString()}`);

    return res.status(200).json(product);
  } catch (err) {
    // If ctGet throws with { status, body }, surface it to help debugging
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.body || err?.message || "Product fetch failed" });
  }
}