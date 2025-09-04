// pages/api/cart/set-customer.js
 import { ctFetch } from '../../../lib/ct-rest';
import { sendCtError } from './_utils/ctErrors';

/**
 * Only set customerId on carts. Do NOT set customerGroup on a cart that will have a customer.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { cartId, version, customerId } = body || {};

    if (!cartId || typeof version !== 'number') {
      return res.status(400).json({ message: 'Missing cartId or version' });
    }

    const actions = [];
    if (customerId) actions.push({ action: 'setCustomerId', customerId });

    if (actions.length === 0) {
      const latest = await ctFetch(`/carts/${encodeURIComponent(cartId)}`);
      return res.status(200).json({ ...latest, _note: 'No cart update needed.' });
    }

    const updated = await ctFetch(`/carts/${encodeURIComponent(cartId)}`, {
      method: 'POST',
      body: JSON.stringify({ version, actions }),
    });
    return res.status(200).json(updated);
  } catch (err) {
    return sendCtError(res, err);
  }
}
