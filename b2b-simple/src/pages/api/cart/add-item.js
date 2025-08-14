// src/pages/api/cart/add-item.js
import { getApiRoot } from "@/pages/utils/ct-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ Parse JSON body safely
    const { cartId, sku, quantity } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!cartId || !sku) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const apiRoot = getApiRoot();

    // 1. Fetch latest cart version
    const cartRes = await apiRoot.carts().withId({ ID: cartId }).get().execute();
    const cart = cartRes.body;

    // 2. Add line item by SKU
    const updateRes = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version: cart.version,
          actions: [
            {
              action: "addLineItem",
              sku,
              quantity: quantity || 1,
            },
          ],
        },
      })
      .execute();

    return res.status(200).json(updateRes.body);
  } catch (err) {
    console.error("❌ add-line-item error", err);
    return res.status(500).json({ error: err.message });
  }
}
