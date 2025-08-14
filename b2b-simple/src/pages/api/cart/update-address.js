/* eslint-disable no-console */
import { getCTToken } from "../../../../lib/ctAuth.js";
import { ctGet, ctPost } from "../../../../lib/ct-rest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { cartId, shippingAddress, billingAddress } = req.body || {};
  if (!cartId || !shippingAddress?.country) {
    return res.status(400).json({ error: "cartId + shippingAddress.country required" });
  }

  try {
    const { access_token } = await getCTToken();
    const cart = await ctGet(`/carts/${cartId}`, access_token);

    const actions = [
      { action: "setShippingAddress", address: shippingAddress },
      { action: "setBillingAddress",  address: billingAddress || shippingAddress },
    ];

    const updated = await ctPost(`/carts/${cartId}`, { version: cart.version, actions }, access_token);
    return res.status(200).json(updated);
  } catch (e) {
    return res.status(e?.status || 500).json(e?.body || { error: "Unexpected error" });
  }
}

/components/pages (browser)
await fetch("/api/cart/update-address", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cartId, shippingAddress, billingAddress }),
});

const methodsRes = await fetch(`/api/cart/shipping-methods?cartId=${cart.id}`);
const methods = methodsRes.ok ? await methodsRes.json() : [];