import { ctFetch } from '@/lib/ct-fetch';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch first 100 products
    const result = await ctFetch(`/products?limit=100`);

    const updates = [];
    for (const product of result.results || []) {
      if (product.priceMode === "Standalone") {
        console.log(`Updating product ${product.key} (${product.id}) → Embedded`);
        updates.push(
          ctFetch(`/products/${encodeURIComponent(product.id)}`, {
            method: "POST",
            body: JSON.stringify({
              version: product.version,
              actions: [{ action: "setPriceMode", priceMode: "Embedded" }],
            }),
          })
        );
      }
    }

    const responses = await Promise.all(updates);

    return res.status(200).json({
      totalProducts: result.results?.length || 0,
      updatedCount: responses.length,
      updatedProducts: responses.map((body) => ({ id: body.id, key: body.key, priceMode: body.priceMode })),
    });
  } catch (err) {
    console.error("Bulk set priceMode error:", err);
    return res.status(500).json({ error: err.message || "Bulk update failed" });
  }
}
