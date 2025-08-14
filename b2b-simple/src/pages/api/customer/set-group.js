import { getApiRoot } from '@/pages/utils/ct-sdk';
import { sendFromCtSdk, sendCtError } from '../cart/_utils/ctErrors';

/**
 * Update Customer.customerGroup (source of truth). Client should call /api/cart/recalculate after this.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { customerId, customerGroupId } = body || {};
    if (!customerId || !customerGroupId) {
      return res.status(400).json({ message: 'Missing customerId or customerGroupId' });
    }

    const apiRoot = getApiRoot();

    const getResp = await apiRoot.customers().withId({ ID: customerId }).get().execute();
    if (getResp.statusCode >= 400) return sendFromCtSdk(res, getResp);

    const version = getResp.body.version;

    const updateResp = await apiRoot
      .customers()
      .withId({ ID: customerId })
      .post({
        body: {
          version,
          actions: [
            {
              action: 'setCustomerGroup',
              customerGroup: { typeId: 'customer-group', id: customerGroupId },
            },
          ],
        },
      })
      .execute();

    if (updateResp.statusCode >= 400) return sendFromCtSdk(res, updateResp);
    return res.status(200).json(updateResp.body);
  } catch (err) {
    return sendCtError(res, err);
  }
}