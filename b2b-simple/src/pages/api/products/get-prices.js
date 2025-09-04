// src/pages/api/products/get-prices.js
import { ctFetch } from '@/lib/ct-fetch';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing ?id=PRODUCT_ID query param" });
    }

  // Fetch product by ID via REST
  const product = await ctFetch(`/products/${encodeURIComponent(id)}`);

    // Extract prices from all variants
    const allVariants = [
  product.masterData?.current?.masterVariant || product.masterVariant,
  ...((product.masterData?.current?.variants) || product.variants || []),
    ];

    const prices = allVariants.flatMap((variant) =>
      (variant.prices || []).map((p) => ({
        sku: variant.sku,
        variantId: variant.id,
        value: p.value,
        country: p.country || "Any",
        customerGroup: p.customerGroup?.id || null,
        customerGroupKey: p.customerGroup?.key || null,
        customerGroupName: p.customerGroup?.obj?.name || null,
      }))
    );

    return res.status(200).json({
      productId: product.id,
      productKey: product.key,
      name: product.masterData.current.name,
      priceMode: product.priceMode,
      prices,
    });
  } catch (err) {
    console.error("Get product prices error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to fetch product prices" });
  }
}
