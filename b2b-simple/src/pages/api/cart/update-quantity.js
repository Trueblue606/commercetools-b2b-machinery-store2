import { getApiRoot } from '@/pages/utils/ct-sdk';
import { sendFromCtSdk, sendCtError } from './_utils/ctErrors';

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

    const apiRoot = getApiRoot();
    const resp = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version,
          actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
        },
      })
      .execute();

    if (resp.statusCode >= 400) {
      return sendFromCtSdk(res, resp);
    }

    return res.status(200).json(resp.body);
  } catch (err) {
    return sendCtError(res, err);
  }
}
