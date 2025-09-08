/* eslint-disable no-console */
import { getCTToken } from "@/lib/ctAuth";
import { ctGet, ctPost } from "@/lib/ct-rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { cartId, shippingAddress, billingAddress } = body || {};

  if (!cartId || !shippingAddress?.country) {
    return res.status(400).json({ error: "cartId + shippingAddress.country required" });
  }

  try {
    const { access_token } = await getCTToken();

    // fetch current version
    const cart = await ctGet(`/carts/${encodeURIComponent(cartId)}`, access_token);

    // build update actions
    const actions = [{ action: "setShippingAddress", address: shippingAddress }];
    if (billingAddress) {
      actions.push({ action: "setBillingAddress", address: billingAddress });
    }

    const updated = await ctPost(
      `/carts/${encodeURIComponent(cartId)}`,
      { version: cart.version, actions },
      access_token
    );

    return res.status(200).json(updated);
  } catch (e) {
    return res.status(e?.status || 500).json(e?.body || { error: "Unexpected error" });
  }
}
// End of file. Do not add any browser code below this line.