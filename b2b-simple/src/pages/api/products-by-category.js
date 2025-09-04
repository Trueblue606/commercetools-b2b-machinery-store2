// pages/api/products-by-category.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { categoryId, priceCurrency = 'GBP', priceCountry = 'GB', priceCustomerGroup } = req.query;
  if (!categoryId) return res.status(400).json({ error: 'categoryId required' });

  try {
  const { getCTToken } = await import('../../../lib/ctAuth.js');
  const { API } = await import('../../../lib/ct-rest.js');
    const { access_token } = await getCTToken();

    // 1) query products referencing this category
    const where = encodeURIComponent(`categories(id="${categoryId}")`);
    const selection = new URLSearchParams();
    if (priceCurrency) selection.set('priceCurrency', String(priceCurrency));
    if (priceCountry) selection.set('priceCountry', String(priceCountry));
    if (priceCustomerGroup) selection.set('priceCustomerGroup.id', String(priceCustomerGroup));
    const url = API(`/product-projections?where=${where}&limit=100&${selection.toString()}`);
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to fetch products' });
    const data = await resp.json();

    const products = (data.results || []).map(p => ({
      id: p.id,
      name: p.name?.['en-GB'] || p.name?.['en'] || 'No name',
      sku: p.masterVariant?.sku || '',
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
    }));

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error in products-by-selection API:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}