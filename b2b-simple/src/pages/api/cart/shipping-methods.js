import { getCTToken } from "../../../../lib/ctAuth.js";
import { API } from "../../../../lib/ct-rest.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { cartId } = req.query || {};
  if (!cartId) return res.status(400).json({ error: "Missing cartId" });

  const { access_token } = await getCTToken();

  const r = await fetch(API(`/shipping-methods/matching-cart?cartId=${encodeURIComponent(cartId)}`), {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(r.status).json(j);
  res.status(200).json(j.results || []);
}