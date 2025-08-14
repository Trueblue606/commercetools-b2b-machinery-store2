// src/pages/api/cart/get.js
import { getApiRoot } from "@/pages/utils/ct-sdk";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Cart ID required" });

    const apiRoot = getApiRoot();
    const result = await apiRoot.carts().withId({ ID: id }).get().execute();

    return res.status(200).json(result.body);
  } catch (err) {
    console.error("Get cart error:", err);
    return res.status(404).json({ error: "Cart not found" });
  }
}
