import { ctFetch } from '@/lib/ct-rest';
import { sendCtError } from './_utils/ctErrors';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { cartId, version, lineItemId, quantity } = body || {};

    if (!cartId || typeof version !== 'number' || !lineItemId || typeof quantity !== 'number') {
      return res
        .status(400)
        .json({ message: 'Missing cartId, version, lineItemId, or quantity' });
    }

    const updated = await ctFetch(`/carts/${encodeURIComponent(cartId)}`, {
      method: 'POST',
      body: JSON.stringify({
        version,
        actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
      }),
    });
    return res.status(200).json(updated);
  } catch (err) {
    return sendCtError(res, err);
  }
}
