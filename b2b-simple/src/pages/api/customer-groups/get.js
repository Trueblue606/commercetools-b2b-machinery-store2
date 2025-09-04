// src/pages/api/customer-group/get.js
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing customerGroup id' });

    const getCTToken = (await import('../../../lib/ctAuth.js')).default;
    const { API } = await import('../../../lib/ct-rest.js');

    const { access_token } = await getCTToken();

    const resp = await fetch(API(`/customer-groups/${encodeURIComponent(id)}`), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(resp.status).json({ error: text || 'CT error' });
    }

    const cg = await resp.json();
    return res.status(200).json({
      id: cg.id ?? null,
      key: cg.key ?? null,
      name: cg.name ?? null,
    });
  } catch (e) {
    console.error('GET /api/customer-group/get error:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}
