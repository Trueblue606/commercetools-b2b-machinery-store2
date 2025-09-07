// src/pages/api/cart/get.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const id = req.query.id || req.query.cartId;
    if (!id) return res.status(400).json({ error: "Cart ID required" });

    const { getCTToken } = await import("@/lib/ctAuth");
    const { API } = await import("@/lib/ct-rest");
    const { access_token } = await getCTToken();

    const resp = await fetch(API(`/carts/${encodeURIComponent(id)}`), {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      return res.status(resp.status).send(body || 'Failed to fetch cart');
    }
    const json = await resp.json();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.status(200).json(json);
  } catch (err) {
    console.error("Get cart error:", err);
    return res.status(404).json({ error: "Cart not found" });
  }
}
