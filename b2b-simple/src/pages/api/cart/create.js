// src/pages/api/cart/create.js
import { getCTToken } from "@/lib/ctAuth";
import { ctPost } from "@/lib/ct-rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const bodyIn = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { currency = "GBP", customerGroupId, customerStoreKey, country = "GB" } = bodyIn;

    if (!currency) return res.status(400).json({ error: "currency is required" });

    const { access_token } = await getCTToken();

    const draft = { currency, country };
    if (customerGroupId) draft.customerGroup = { typeId: "customer-group", id: customerGroupId };
    if (customerStoreKey) draft.store = { key: customerStoreKey };

    try {
      const created = await ctPost(`/carts`, draft, access_token);
      return res.status(200).json(created);
    } catch (e) {
      if (e?.status === 409) {
        const created = await ctPost(`/carts`, draft, access_token);
        return res.status(200).json(created);
      }
      return res.status(e?.status || 500).json(e?.body || { error: e?.message || "Cart create failed" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Cart create failed" });
  }
}
