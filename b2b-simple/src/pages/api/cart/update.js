import { getCTToken } from "../../../../lib/ctAuth.js";
import { ctGet, ctPost } from "../../../../lib/ct-rest.js";

/**
 * POST /api/cart/update
 * Body:
 *   - cartId: string (required)
 *   - version?: number (optional; will fetch if omitted)
 *   - actions?: CartUpdateAction[]
 *   - or convenience:
 *       • lineItemId + quantity  -> changeLineItemQuantity
 *       • sku + addQuantity      -> addLineItem
 *
 * Returns: updated cart JSON
 * Retries once on 409 ConcurrentModification
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");

  try {
    const bodyIn = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { cartId, version, actions } = bodyIn;
    if (!cartId) return res.status(400).json({ error: "cartId is required" });

    const { access_token } = await getCTToken();

    // Build actions
    let updateActions = Array.isArray(actions) ? actions : [];
    if (updateActions.length === 0) {
      const { lineItemId, quantity, sku, addQuantity } = bodyIn;
      if (lineItemId && typeof quantity === "number") {
        updateActions = [{ action: "changeLineItemQuantity", lineItemId, quantity }];
      } else if (sku && typeof addQuantity === "number") {
        updateActions = [{ action: "addLineItem", sku, quantity: addQuantity }];
      } else {
        return res.status(400).json({
          error: "actions[] required, or provide (lineItemId+quantity) or (sku+addQuantity).",
        });
      }
    }

    const resolveVersion = async () => {
      if (typeof version === "number") return version;
      const cart = await ctGet(`/carts/${encodeURIComponent(cartId)}`, access_token);
      if (typeof cart?.version !== "number") {
        throw Object.assign(new Error("Could not resolve cart version"), { status: 409 });
      }
      return cart.version;
    };

    const doUpdate = async (v) => {
      return await ctPost(
        `/carts/${encodeURIComponent(cartId)}`,
        { version: v, actions: updateActions },
        access_token
      );
    };

    try {
      const v1 = await resolveVersion();
      const updated = await doUpdate(v1);
      return res.status(200).json(updated);
    } catch (e) {
      if (e?.status === 409) {
        const fresh = await ctGet(`/carts/${encodeURIComponent(cartId)}`, access_token);
        const updated = await doUpdate(fresh.version);
        return res.status(200).json(updated);
      }
      return res.status(e?.status || 500).json(e?.body || { error: e?.message || "Cart update failed" });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Unexpected error" });
  }
}