import { ctFetch } from '@/lib/ct-fetch';
import { sendCtError } from '../cart/_utils/ctErrors';

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

    const current = await ctFetch(`/customers/${encodeURIComponent(customerId)}`);
    const version = current.version;

    const updated = await ctFetch(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'POST',
      body: JSON.stringify({
        version,
        actions: [
          { action: 'setCustomerGroup', customerGroup: { typeId: 'customer-group', id: customerGroupId } },
        ],
      }),
    });
    return res.status(200).json(updated);
  } catch (err) {
    return sendCtError(res, err);
  }
}