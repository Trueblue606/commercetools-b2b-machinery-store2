import { sendCtError } from './_utils/ctErrors';
import { ctFetch } from '@/lib/ct-rest';

/**
 * Recalculate cart prices / selections after customer group change.
 * Body: { cartId, version }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { cartId, version } = body || {};
    if (!cartId || typeof version !== 'number') {
      return res.status(400).json({ message: 'Missing cartId or version' });
    }

    const updated = await ctFetch(`/carts/${encodeURIComponent(cartId)}`, {
      method: 'POST',
      body: JSON.stringify({
        version,
        actions: [{ action: 'recalculate', updateProductData: true }],
      }),
    });
    return res.status(200).json(updated);
  } catch (err) {
    return sendCtError(res, err);
  }
}