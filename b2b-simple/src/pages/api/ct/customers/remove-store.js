// POST { customerId: string, storeKey: string }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const REGION = process.env.CT_REGION || 'eu-central-1';
  const PROJECT_KEY = process.env.CT_PROJECT_KEY;
  const API = `https://api.${REGION}.aws.commercetools.com`;
  try {
    const { customerId, storeKey } = req.body || {};
    if (!customerId || !storeKey) return res.status(400).json({ error: 'customerId and storeKey are required' });

    const authRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cart/auth`);
    const { token } = await authRes.json();

    const read = await fetch(`${API}/${PROJECT_KEY}/customers/${encodeURIComponent(customerId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!read.ok) return res.status(read.status).json({ error: await read.text() });
    const cust = await read.json();

    const upd = await fetch(`${API}/${PROJECT_KEY}/customers/${cust.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: cust.version,
        actions: [{ action: 'removeStore', store: { typeId: 'store', key: storeKey } }],
      }),
    });
    if (!upd.ok) return res.status(upd.status).json({ error: await upd.text() });
    return res.status(200).json(await upd.json());
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
