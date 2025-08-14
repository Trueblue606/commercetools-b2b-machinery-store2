// pages/api/cart/[cartId].js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { cartId } = req.query;
    if (!cartId) return res.status(400).json({ error: "cartId is required" });

    const REGION      = process.env.CT_REGION || "eu-central-1";
    const PROJECT_KEY = process.env.CT_PROJECT_KEY;
    const API_URL     = `https://api.${REGION}.aws.commercetools.com`;

    // 🔑 Get a fresh token
    const authRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cart/auth`);
    const { token } = await authRes.json();

    // 📦 Fetch cart
    const resp = await fetch(`${API_URL}/${PROJECT_KEY}/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const error = await resp.text();
      return res.status(resp.status).json({ error });
    }

    const cart = await resp.json();
    return res.status(200).json(cart);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
