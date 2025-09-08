/* eslint-disable no-console */
import { getCTToken } from "@/lib/ctAuth";

const REGION      = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const API_URL     = `https://api.${REGION}.aws.commercetools.com`;

async function readCTError(resp) {
  let rawText = "";
  try { rawText = await resp.text(); } catch {}
  let json = null;
  try { json = rawText ? JSON.parse(rawText) : null; } catch {}
  return { status: resp.status, json, rawText };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { cartId, customerId } = req.body || {};
  if (!cartId || !customerId) return res.status(400).json({ error: "Missing cartId or customerId" });

  try {
    const { access_token } = await getCTToken();

    // 1) Load customer
    const custResp = await fetch(`${API_URL}/${PROJECT_KEY}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!custResp.ok) {
      const e = await readCTError(custResp);
      return res.status(e.status || 500).json({ error: "Failed to fetch customer", details: e });
    }
    const customer = await custResp.json();
    const addrs = Array.isArray(customer.addresses) ? customer.addresses : [];

    if (!addrs.length) {
      return res.status(400).json({ error: "Customer has no addresses to use." });
    }

    const getById = (id) => addrs.find(a => a.id === id);
    const ship = getById(customer.defaultShippingAddressId) || addrs[0];
    const bill = getById(customer.defaultBillingAddressId) || ship;

    // Basic safety: ensure country is present (commercetools requires it on addresses)
    if (!ship.country || !bill.country) {
      return res.status(400).json({ error: "Address is missing country (e.g. 'GB'). Please add it in Merchant Center." });
    }

    // 2) Load cart to get version
    const cartResp = await fetch(`${API_URL}/${PROJECT_KEY}/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!cartResp.ok) {
      const e = await readCTError(cartResp);
      return res.status(e.status || 500).json({ error: "Failed to fetch cart", details: e });
    }
    const cart = await cartResp.json();

    // 3) Update cart addresses (inline base addresses)
    const updateResp = await fetch(`${API_URL}/${PROJECT_KEY}/carts/${cartId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: cart.version,
        actions: [
          { action: "setShippingAddress", address: ship },
          { action: "setBillingAddress",  address: bill },
        ],
      }),
    });

    if (!updateResp.ok) {
      const e = await readCTError(updateResp);
      return res.status(e.status || 500).json({ error: "Failed to set addresses on cart", details: e });
    }

    const updated = await updateResp.json();
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error", details: String(err) });
  }
}
