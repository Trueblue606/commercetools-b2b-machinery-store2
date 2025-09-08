// src/pages/api/customer-groups/list.js
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const getCTToken = (await import("@/lib/ctAuth")).default;
    const { API } = await import("@/lib/ct-rest");

    const { access_token } = await getCTToken();

    const resp = await fetch(API('/customer-groups'), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(resp.status).json({ error: text || 'CT error' });
    }

    const data = await resp.json();
    const groups = (data.results || []).map(g => ({
      id: g.id,
      key: g.key || null,
      name: g.name || null,
    }));

    return res.status(200).json(groups);
  } catch (err) {
    console.error('Customer groups fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch customer groups' });
  }
}
