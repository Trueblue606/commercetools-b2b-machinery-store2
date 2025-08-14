// pages/api/cart/set-customer.js
import { getApiRoot } from '@/pages/utils/ct-sdk';
import { sendFromCtSdk, sendCtError } from './_utils/ctErrors';

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

    const apiRoot = getApiRoot();

    if (actions.length === 0) {
      // no-op: return latest cart
      const cartResp = await apiRoot.carts().withId({ ID: cartId }).get().execute();
      if (cartResp.statusCode >= 400) return sendFromCtSdk(res, cartResp);
      return res.status(200).json({ ...cartResp.body, _note: 'No cart update needed.' });
    }

    const resp = await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({ body: { version, actions } })
      .execute();

    if (resp.statusCode >= 400) return sendFromCtSdk(res, resp);
    return res.status(200).json(resp.body);
  } catch (err) {
    return sendCtError(res, err);
  }
}
