import { getCTToken } from "@/lib/ctAuth";
import { API } from "@/lib/ct-rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { cartId, shippingMethodId } = body || {};
  if (!cartId || !shippingMethodId) return res.status(400).json({ error: "Missing cartId or shippingMethodId" });

  try {
    const { access_token } = await getCTToken();

    const getCart = async () => {
      const r = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const j = await r.json();
      return { r, j };
    };

    const updateOnce = async (version) => {
      const r = await fetch(API(`/carts/${encodeURIComponent(cartId)}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          actions: [{ action: "setShippingMethod", shippingMethod: { typeId: "shipping-method", id: shippingMethodId } }],
        }),
      });
      const j = await r.json();
      return { r, j };
    };

    // initial fetch + update
    let { r: rc, j: cart } = await getCart();
    if (!rc.ok) return res.status(rc.status).json(cart);

    let { r: ru, j: updated } = await updateOnce(cart.version);

    // one-time 409 retry
    if (ru.status === 409) {
      ({ r: rc, j: cart } = await getCart());
      if (!rc.ok) return res.status(rc.status).json(cart);
      ({ r: ru, j: updated } = await updateOnce(cart.version));
    }

    if (!ru.ok) return res.status(ru.status).json(updated);
    return res.status(200).json(updated);
  } catch (e) {
    console.error("set-shipping-method error", e);
    return res.status(500).json({ error: "Unexpected error", details: String(e) });
  }
}