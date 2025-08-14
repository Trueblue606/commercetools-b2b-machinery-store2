import { getApiRoot } from "@/pages/utils/ct-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiRoot = getApiRoot();

    // Fetch first 100 products
    const result = await apiRoot.products().get({ queryArgs: { limit: 100 } }).execute();

    const updates = [];

    for (const product of result.body.results) {
      if (product.priceMode === "Standalone") {
        console.log(`Updating product ${product.key} (${product.id}) → Embedded`);
        updates.push(
          apiRoot
            .products()
            .withId({ ID: product.id })
            .post({
              body: {
                version: product.version,
                actions: [{ action: "setPriceMode", priceMode: "Embedded" }],
              },
            })
            .execute()
        );
      }
    }

    const responses = await Promise.all(updates);

    return res.status(200).json({
      totalProducts: result.body.results.length,
      updatedCount: responses.length,
      updatedProducts: responses.map((r) => ({
        id: r.body.id,
        key: r.body.key,
        priceMode: r.body.priceMode,
      })),
    });
  } catch (err) {
    console.error("Bulk set priceMode error:", err);
    return res.status(500).json({ error: err.message || "Bulk update failed" });
  }
}
