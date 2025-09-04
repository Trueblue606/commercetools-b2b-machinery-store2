/* eslint-disable no-console */
// pages/api/orders/list.js
import { getCTToken } from "../../../../lib/ctAuth";

const REGION      = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const API_URL     =
  (process.env.CT_API_URL && process.env.CT_API_URL.replace(/\/$/, "")) ||
  `https://api.${REGION}.aws.commercetools.com`;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const customerId = String(req.query.customerId || "").trim();

    let url;
    let headers = {};

    if (authHeader) {
      // Customer login token present → use /me/orders
      headers.Authorization = authHeader;
      const params = new URLSearchParams({
        sort: "createdAt desc",
        limit: "50",
      });
      url = `${API_URL}/${PROJECT_KEY}/me/orders?${params.toString()}`;
    } else {
      // Admin fallback → restrict by customerId if provided
      const tokObj = await getCTToken();
      const adminAccess = tokObj?.access_token || tokObj;
      headers.Authorization = `Bearer ${adminAccess}`;

      const params = new URLSearchParams({
        sort: "createdAt desc",
        limit: "50",
      });
      if (customerId) {
        // where=customerId="<id>"
        params.append("where", `customerId="${customerId}"`);
      }
      url = `${API_URL}/${PROJECT_KEY}/orders?${params.toString()}`;
    }

    const r = await fetch(url, { headers });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res
        .status(r.status)
        .json({ error: j?.message || "Failed to fetch orders" });
    }

    res.status(200).json({
      count: j.count || 0,
      results: j.results || [],
    });
  } catch (e) {
    console.error("Order list error", e);
    res.status(500).json({ error: e?.message || "Internal error" });
  }
}
