// src/pages/api/cart/create.js
import { getApiRoot } from "@/pages/utils/ct-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { currency = "GBP", customerGroupId, customerStoreKey, country = "GB" } = req.body || {};

    if (!currency) {
      return res.status(400).json({ error: "currency is required" });
    }

    const apiRoot = getApiRoot();

    const body = {
      currency,
      country,
    };

    // ✅ Attach customerGroup if passed
    if (customerGroupId) {
      body.customerGroup = { typeId: "customer-group", id: customerGroupId };
    }

    // ✅ Attach store if customer has a store
    if (customerStoreKey) {
      body.store = { key: customerStoreKey };
    }

    const result = await apiRoot.carts().post({ body }).execute();

    return res.status(200).json(result.body);
  } catch (err) {
    console.error("Cart create error:", err);
    return res.status(500).json({ error: err.message || "Cart create failed" });
  }
}
