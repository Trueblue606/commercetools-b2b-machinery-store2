// pages/api/categories.js
import { getCTToken } from '@/lib/ctAuth.js';
import { API } from '@/lib/ct-rest.js';

export default async function handler(req, res) {
  try {
    const { access_token } = await getCTToken();

    const r = await fetch(API('/categories?limit=200&sort=orderHint asc'), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json(data);

    const categories = (data.results || []).map((c) => ({
      id: c.id,
      name: c?.name?.['en-GB'] || c?.name?.en || c.key || 'Unnamed',
    }));

    res.status(200).json({ categories, authToken: access_token });
  } catch (e) {
    console.error('categories API failed:', e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
}
