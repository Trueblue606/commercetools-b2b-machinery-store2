// pages/api/search.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q: query, limit = 50 } = req.query;

  if (!query || query.trim().length < 1) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Get auth token
    const authRes = await fetch(
      'https://auth.eu-central-1.aws.commercetools.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            '8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y'
          ).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      }
    );

    const auth = await authRes.json();
    const token = auth.access_token;

    // Get all products and filter client-side (simpler approach)
    const productsRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?limit=200`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
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