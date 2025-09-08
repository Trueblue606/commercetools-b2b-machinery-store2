/* eslint-disable no-console */
// pages/api/orders/get.js
// pages/api/orders/get.js
import { getCTToken } from "@/lib/ctAuth";



const REGION      = process.env.CT_REGION || "eu-central-1";
const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const API_URL     =
  (process.env.CT_API_URL && process.env.CT_API_URL.replace(/\/$/, "")) ||
  `https://api.${REGION}.aws.commercetools.com`;

// Utility: safe JSON parsing of CT error payloads
async function readCT(resp) {
  const text = await resp.text().catch(() => "");
  try { return { status: resp.status, json: text ? JSON.parse(text) : null, text }; }
  catch { return { status: resp.status, json: null, text }; }
}

// Get full order (tries /me/orders/{id} with provided bearer, then falls back to admin /orders/{id})
async function fetchOrderSmart(orderId, possibleCustomerBearer) {
  // 1) Try with customer token (if caller provided one)
  if (possibleCustomerBearer) {
    const r = await fetch(`${API_URL}/${PROJECT_KEY}/me/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: possibleCustomerBearer },
    });
    if (r.ok) return await r.json();
  }

  // 2) Fallback with admin token
  const tokObj = await getCTToken();
  const adminAccess = tokObj?.access_token || tokObj;
  if (!adminAccess) throw new Error("Admin token unavailable");
  const adminBearer = `Bearer ${adminAccess}`;

  const r2 = await fetch(`${API_URL}/${PROJECT_KEY}/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: adminBearer },
  });

  if (!r2.ok) {
    const err = await readCT(r2);
    const msg = err?.json?.message || err.text || "Order not found";
    const status = err?.status || 404;
    const e = new Error(msg);
    e.status = status;
    throw e;
  }
  return await r2.json();
}

// Enrich each line item with product images (server-side)
async function enrichLineItemsWithImages(order) {
  const tokObj = await getCTToken();
  const adminAccess = tokObj?.access_token || tokObj;
  const adminBearer = `Bearer ${adminAccess}`;

  const items = Array.isArray(order?.lineItems) ? order.lineItems : [];
  const enriched = await Promise.all(items.map(async (li) => {
    let images = [];
    try {
      if (li?.productId) {
        const pr = await fetch(`${API_URL}/${PROJECT_KEY}/product-projections/${encodeURIComponent(li.productId)}`, {
          headers: { Authorization: adminBearer },
        });
        if (pr.ok) {
          const pj = await pr.json();
          images = pj?.masterVariant?.images || [];
        }
      }
    } catch {}
    const priceValue = li?.price?.discounted?.value || li?.price?.value || {};
    const centAmount = priceValue?.centAmount ?? 0;
    const currencyCode = priceValue?.currencyCode || "GBP";

    const localizedName = li?.name || {};
    const name = localizedName["en-GB"] || localizedName["en"] || Object.values(localizedName)[0] || li?.productId || "Item";

    return {
      id: li.id,
      productId: li.productId,
      name,
      sku: li?.variant?.sku || "",
      quantity: li?.quantity ?? 0,
      price: {
        centAmount,
        currencyCode,
        formatted: `${currencyCode} ${(centAmount / 100).toFixed(2)}`
      },
      images
    };
  }));

  return enriched;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const orderId = String(req.query.id || "").trim();
  if (!orderId) return res.status(400).json({ error: "Missing id" });

  try {
    // If caller sends a customer token, honor it for /me/orders
    const authHeader = req.headers.authorization; // "Bearer <customer-token>" (optional)
    const order = await fetchOrderSmart(orderId, authHeader);

    // Normalize + enrich
    const lineItems = await enrichLineItemsWithImages(order);

    const gross = order?.totalPrice?.centAmount || 0;
    const totalCurrency = order?.totalPrice?.currencyCode || "GBP";

    const shaped = {
      id: order.id,
      orderNumber: order.orderNumber || null,
      orderState: order.orderState,
      createdAt: order.createdAt,
      lastModifiedAt: order.lastModifiedAt,
      customerEmail: order.customerEmail,
      customerId: order.customerId,
      totalPrice: {
        centAmount: gross,
        currencyCode: totalCurrency,
        formatted: `${totalCurrency} ${(gross / 100).toFixed(2)}`
      },
      taxedPrice: order.taxedPrice || null,
      shippingAddress: order.shippingAddress || null,
      billingAddress: order.billingAddress || null,
      lineItems,
      summary: {
        totalQuantity: lineItems.reduce((s, it) => s + (it.quantity || 0), 0),
        status: {
          label:
            order.orderState === "Open" ? "Processing" :
            order.orderState === "Complete" ? "Delivered" :
            order.orderState || "—"
        }
      }
    };

    res.status(200).json(shaped);
  } catch (e) {
    const status = e?.status || 404;
    res.status(status).json({ error: e?.message || "Order not found" });
  }
}
