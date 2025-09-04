// /b2b-simple/src/pages/api/orders/create.js
import { sendCtError } from '../cart/_utils/ctErrors';

/**
 * Creates an Order from a Cart.
 * - Accepts JSON body with: { cartId, cartVersion, shippingAddress?, billingAddress?, customerEmail?, orderNotes?, shippingCost?, requiresShipping? }
 * - Optionally applies addresses to the cart first (so the order carries them).
 * - Returns JSON always: { success, id, orderNumber, totalPrice, taxedPrice, customerEmail, createdAt, lineItems }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Robust body parse (avoid double-parsing when Next.js already did it)
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const {
      cartId,
      cartVersion,
      shippingAddress,
      billingAddress,
      customerEmail,
      // orderNotes, shippingCost, requiresShipping  // available if you want to persist as custom fields
    } = body;

    if (!cartId || typeof cartVersion !== 'number') {
      return res.status(400).json({ success: false, message: 'Missing cartId or cartVersion' });
    }

  // Note: This file delegates to ../order/create at bottom; keeping legacy logic for reference

    // 1) Optionally set addresses on the cart (idempotent if unchanged)
    let currentVersion = cartVersion;
    const actions = [];
    if (shippingAddress) actions.push({ action: 'setShippingAddress', address: shippingAddress });
    if (billingAddress) actions.push({ action: 'setBillingAddress', address: billingAddress });

    if (actions.length > 0) {
  // REST equivalent lives in ../order/create
    }

    // 2) Create Order from Cart
    const orderNumber = `ORD-${Date.now()}`; // demo-friendly order number
    const orderDraft = {
      id: cartId,          // Cart ID
      version: currentVersion, // latest Cart version
      orderNumber,         // optional but nice for demo
      orderState: 'Open',
    };

  const order = null; // not used, see re-export below

    // 3) Reply with a compact, consistent JSON shape
    return res.status(200).json({
      success: true,
      id: order.id,
      orderNumber: order.orderNumber || orderNumber,
      totalPrice: order.totalPrice,     // CT Money
      taxedPrice: order.taxedPrice,     // optional, if taxed
      customerEmail: order.customerEmail || customerEmail || null,
      createdAt: order.createdAt,
      lineItems: order.lineItems || [],
    });
  } catch (err) {
    // If CT SDK threw and included { statusCode, body }, we forward; otherwise 500 JSON with message
    return sendCtError(res, err);
  }
}

// Delegate to the REST implementation at /api/order/create (singular)
export { default } from "../order/create";
