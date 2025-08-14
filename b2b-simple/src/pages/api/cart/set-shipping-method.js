import { getCTToken } from "../../../../lib/ctAuth";
const API = (p) => `https://api.${process.env.CT_REGION || "eu-central-1"}.aws.commercetools.com/${process.env.CT_PROJECT_KEY}${p}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { cartId, shippingMethodId } = body || {};
  if (!cartId || !shippingMethodId) return res.status(400).json({ error: "Missing cartId or shippingMethodId" });

  try {
    const { access_token } = await getCTToken();

    // get cart to obtain current version
    const c = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const cart = await c.json();
    if (!c.ok) return res.status(c.status).json(cart);

    const upd = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: cart.version,
        actions: [
          {
            action: "setShippingMethod",
            shippingMethod: { typeId: "shipping-method", id: shippingMethodId },
          },
        ],
      }),
    });

    const updated = await upd.json();
    if (!upd.ok) return res.status(upd.status).json(updated);
    return res.status(200).json(updated);
  } catch (e) {
    console.error("set-shipping-method error", e);
    return res.status(500).json({ error: "Unexpected error", details: String(e) });
  }
}