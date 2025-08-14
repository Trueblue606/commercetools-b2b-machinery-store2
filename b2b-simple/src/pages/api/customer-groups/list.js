// src/pages/api/customer-groups/list.js
import { getApiRoot } from "@/pages/utils/ct-sdk";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiRoot = getApiRoot();

    const result = await apiRoot
      .customerGroups()
      .get()
      .execute();

    // Return all customer groups with name + ID
    const groups = result.body.results.map((g) => ({
      id: g.id,
      key: g.key,
      name: g.name,
    }));

    return res.status(200).json(groups);
  } catch (err) {
    console.error("Customer groups fetch error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to fetch customer groups" });
  }
}
