import { getCTToken } from "../../../../lib/ctAuth.js";
import { ctGet, ctPost } from "../../../../lib/ct-rest.js";

/**
 * POST /api/order/create
 * Body: {
 *   cartId: string,
 *   shippingAddress?: Address,
 *   billingAddress?: Address,
 *   customerEmail?: string,
 *   // optional safety valve if cart was created anon and UI has the id:
 *   customerId?: string
 * }
 *
 * Guarantees before creating an order (UK-only POC):
 * - Cart is Active
 * - Cart.country === "GB"
 * - Cart currency is GBP (carts are immutable currency; we just assert)
 * - Cart has a customerId (so group pricing is deterministic)
 * - Shipping/Billing present and shipping method selected
 * - Retries once on 409 for both cart update and order create
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { cartId, shippingAddress, billingAddress, customerEmail, customerId: bodyCustomerId } = body;
    if (!cartId) return res.status(400).json({ error: "cartId is required" });

    const { access_token } = await getCTToken();

    const getCart = async () => ctGet(`/carts/${encodeURIComponent(cartId)}`, access_token);
    const findExistingOrderForCart = async (id) => {
      const where = encodeURIComponent(`cart(id="${id}")`);
      const found = await ctGet(`/orders?where=${where}&limit=1`, access_token);
      return found?.results?.[0] || null;
    };
    const updateCart = async ({ version, actions }) =>
      ctPost(`/carts/${encodeURIComponent(cartId)}`, { version, actions }, access_token);

    // 1) Load cart
    let cart = await getCart();

    // 1a) Idempotency: if not Active, return the existing order if present
    if (cart.cartState && cart.cartState !== "Active") {
      const existing = await findExistingOrderForCart(cart.id);
      if (existing) return res.status(200).json(existing);
      return res.status(409).json({ error: `Cart is ${cart.cartState}. Use a fresh cart.` });
    }

    // --- UK-only scope guarantees (GBP/GB + customer) ---
    // Currency is set at creation and immutable; assert it's GBP
    const currency = cart?.totalPrice?.currencyCode || cart?.currency;
    if (currency && currency !== "GBP") {
      return res.status(400).json({ error: `Cart currency must be GBP for UK POC (found ${currency}).` });
    }

    // If cart was (re)created after a clear, it may be v1 with no country/customer.
    // Build scope-fix actions in ONE update to avoid races.
    const scopeActions = [];

    if (cart.country !== "GB") {
      scopeActions.push({ action: "setCountry", country: "GB" });
    }

    // Resolve a customerId to attach if cart is missing one.
    // Prefer existing cart.customerId, else use body.customerId, else (optional) header.
    const resolvedCustomerId =
      cart.customerId ||
      bodyCustomerId ||
      req.headers["x-customer-id"] ||
      null;

    if (!cart.customerId) {
      if (!resolvedCustomerId) {
        // For this POC we require a logged-in customer so CT can resolve group prices deterministically
        return res.status(401).json({ error: "Customer must be attached to cart before ordering (missing customerId)." });
      }
      scopeActions.push({ action: "setCustomerId", customerId: String(resolvedCustomerId) });
    }

    // Addresses / email actions (apply together with scope fixes)
    if (shippingAddress) scopeActions.push({ action: "setShippingAddress", address: shippingAddress });
    if (billingAddress)  scopeActions.push({ action: "setBillingAddress",  address: billingAddress  });
    if (customerEmail)   scopeActions.push({ action: "setCustomerEmail",   email:  customerEmail    });

    // If we have any actions to apply, do it now with a 409 retry
    if (scopeActions.length > 0) {
      const doScopeUpdate = async (version) => updateCart({ version, actions: scopeActions });
      try {
        cart = await doScopeUpdate(cart.version);
      } catch (e) {
        if (e?.status === 409) {
          const fresh = await getCart();
          if (fresh.cartState && fresh.cartState !== "Active") {
            const existing = await findExistingOrderForCart(fresh.id);
            if (existing) return res.status(200).json(existing);
            return res.status(409).json({ error: `Cart is ${fresh.cartState}. Use a fresh cart.` });
          }
          cart = await doScopeUpdate(fresh.version);
        } else {
          return res.status(e?.status || 500).json(e?.body || { error: e?.message || "Cart update (scope) failed" });
        }
      }
    }

    // 2) Validate required fields AFTER scope update
    const hasLines = Array.isArray(cart?.lineItems) && cart.lineItems.length > 0;
    if (!hasLines) return res.status(400).json({ error: "Cart has no line items" });
    if (cart.country !== "GB") return res.status(400).json({ error: "Cart.country must be GB (UK-only POC)" });

    const curr = cart?.totalPrice?.currencyCode || cart?.currency;
    if (curr !== "GBP") return res.status(400).json({ error: "Cart currency must be GBP (UK-only POC)" });

    if (!cart.customerId) return res.status(401).json({ error: "Cart has no customerId after scope normalization" });

    const willHaveShipping = cart.shippingAddress;
    const willHaveBilling  = cart.billingAddress;
    const hasMethod        = cart?.shippingInfo?.shippingMethod?.id;

    if (!willHaveShipping?.country) return res.status(400).json({ error: "Missing shipping address" });
    if (!willHaveBilling?.country)  return res.status(400).json({ error: "Missing billing address" });
    if (!hasMethod)                 return res.status(400).json({ error: "Missing selected shipping method" });

    // Extra UK guard: enforce GB addresses in POC
    if (willHaveShipping?.country !== "GB" || willHaveBilling?.country !== "GB") {
      return res.status(403).json({ error: "UK-only POC: shipping/billing country must be GB" });
    }

    // 3) Create order from cart (retry once on 409)
    const makeDraft = (version) => ({
      id: cart.id,
      version,
      orderNumber: `WEB-${Date.now()}`
    });

    try {
      const order = await ctPost(`/orders`, makeDraft(cart.version), access_token);
      return res.status(200).json(order);
    } catch (e) {
      if (e?.status === 409) {
        const fresh = await getCart();
        if (fresh.cartState && fresh.cartState !== "Active") {
          const existing = await findExistingOrderForCart(fresh.id);
          if (existing) return res.status(200).json(existing);
          return res.status(409).json({ error: `Cart is ${fresh.cartState}. Use a fresh cart.` });
        }
        const order = await ctPost(`/orders`, makeDraft(fresh.version), access_token);
        return res.status(200).json(order);
      }
      return res.status(e?.status || 500).json(e?.body || { error: e?.message || "Order create failed" });
    }
  } catch (err) {
    return res.status(err?.status || 500).json(err?.body || { error: err?.message || "Order create failed" });
  }
}
