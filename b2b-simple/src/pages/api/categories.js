// pages/api/categories.js
import { getCTToken } from '@/lib/ctAuth';
import { API } from '@/lib/ct-rest';

const LOCALE = process.env.NEXT_PUBLIC_CT_LOCALE || 'en-GB';

function pickLocalized(obj, locale = LOCALE) {
  if (!obj || typeof obj !== 'object') return '';
  if (obj[locale]) return obj[locale];
  if (obj['en-GB']) return obj['en-GB'];
  if (obj.en) return obj.en;
  const first = Object.values(obj)[0];
  return typeof first === 'string' ? first : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    // ✅ Handle both string and object token shapes
    const raw = await getCTToken();
    const accessToken =
      typeof raw === 'string' ? raw : (raw?.access_token || raw?.token || '');

    if (!accessToken) {
      // Don’t crash the UI — degrade gracefully
      return res.status(200).json({
        ok: false,
        error: 'No CT access token (check CT_* env or ctAuth)',
        categories: [],
      });
    }

    const url = API('/categories?limit=200&withTotal=false&sort=orderHint%20asc');
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    const text = await r.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!r.ok) {
      // ✅ Don’t bubble non-200 upstream — keep app shell alive
      return res.status(200).json({
        ok: false,
        error: `CT categories ${r.status} ${r.statusText}`,
        details: data?.message || data?.errors || data,
        categories: [],
      });
    }

    const categories = Array.isArray(data?.results)
      ? data.results.map((c) => ({
          id: c.id,
          key: c.key || null,
          name: pickLocalized(c.name) || c.key || 'Unnamed',
          parentId: c.parent?.id || null,
          orderHint: c.orderHint || '',
        }))
      : [];

    return res.status(200).json({
      ok: true,
      categories,
      // Only include token if you intentionally want client access (optional)
      // authToken: accessToken,
    });
  } catch (e) {
    console.error('categories API failed:', e);
    // ✅ Last-ditch safety: never 500 the client for categories
    return res.status(200).json({
      ok: false,
      error: e?.message || 'Failed to load categories',
      categories: [],
    });
  }
}
