// src/pages/api/cart/add-item.js

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

    const { getCTToken } = await import("@/lib/ctAuth");
    const { API } = await import("@/lib/ct-rest");
    const { access_token } = await getCTToken();

    // 1. Fetch latest cart version
    const cartRes = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!cartRes.ok) {
      const t = await cartRes.text().catch(() => '');
      return res.status(cartRes.status).send(t || 'Failed to load cart');
    }
    const cart = await cartRes.json();

    // 2. Add line item by SKU via update action
    const updateRes = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({
        version: cart.version,
        actions: [
          { action: 'addLineItem', sku, quantity: quantity || 1 }
        ],
      }),
    });
    if (!updateRes.ok) {
      const t = await updateRes.text().catch(() => '');
      return res.status(updateRes.status).send(t || 'Failed to add item');
    }
    const updated = await updateRes.json();
    return res.status(200).json(updated);
  } catch (err) {
    console.error("❌ add-line-item error", err);
    return res.status(500).json({ error: err.message });
  }
}
