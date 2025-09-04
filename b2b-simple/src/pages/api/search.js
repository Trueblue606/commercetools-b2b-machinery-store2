// pages/api/search.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q: query, limit = 50, priceCurrency = 'GBP', priceCountry = 'GB', priceCustomerGroup } = req.query;

  if (!query || query.trim().length < 1) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const { getCTToken } = await import('../../../lib/ctAuth.js');
  const { API } = await import('../../../lib/ct-rest.js');
    const { access_token } = await getCTToken();

    const sp = new URLSearchParams();
    sp.set('limit', '200');
    if (priceCurrency) sp.set('priceCurrency', String(priceCurrency));
    if (priceCountry) sp.set('priceCountry', String(priceCountry));
    if (priceCustomerGroup) sp.set('priceCustomerGroup.id', String(priceCustomerGroup));

    const productsRes = await fetch(
      API(`/product-projections?${sp.toString()}`),
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!productsRes.ok) {
      throw new Error(`Failed to fetch products: ${productsRes.status}`);
    }

    const productsData = await productsRes.json();

    // Filter products client-side
    const searchTerm = query.trim().toLowerCase();
    const filteredProducts = productsData.results.filter(p => {
      const name = (p.name['en-GB'] || p.name['en'] || '').toLowerCase();
      const sku = (p.masterVariant?.sku || '').toLowerCase();
      return name.includes(searchTerm) || sku.includes(searchTerm);
    });

    // Transform results
  const products = filteredProducts.slice(0, parseInt(limit)).map((p) => ({
      id: p.id,
      name: p.name['en-GB'] || p.name['en'] || 'No name',
      sku: p.masterVariant?.sku || '',
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
      description: p.description?.['en-GB'] || p.description?.['en'] || '',
      categories: p.categories || [],
    }));

    res.status(200).json({
      products,
      total: filteredProducts.length,
      count: products.length,
      offset: 0,
      query: query.trim()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: 'Search failed', 
      error: error.message 
    });
  }
}