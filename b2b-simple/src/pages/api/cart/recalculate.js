import { getApiRoot } from '@/pages/utils/ct-sdk';
import { sendFromCtSdk, sendCtError } from './_utils/ctErrors';

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

    const apiRoot = getApiRoot();
    const resp = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version,
          actions: [{ action: 'recalculate', updateProductData: true }],
        },
      })
      .execute();

    if (resp.statusCode >= 400) return sendFromCtSdk(res, resp);
    return res.status(200).json(resp.body);
  } catch (err) {
    return sendCtError(res, err);
  }
}