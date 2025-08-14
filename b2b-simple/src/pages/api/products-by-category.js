// pages/api/products-by-selection.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { selectionId } = req.query;

  if (!selectionId) {
    return res.status(400).json({ error: 'Selection ID required' });
  }

  try {
    // Get OAuth token
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

    if (!authRes.ok) {
      console.error('Auth failed:', authRes.status);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    const auth = await authRes.json();

    // Fetch products in this selection
    const productsRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-selections/${selectionId}/products?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    if (!productsRes.ok) {
      console.error('Failed to fetch products in selection:', productsRes.status);
      return res.status(200).json({ products: [] });
    }

    const productsData = await productsRes.json();

    // Get full product details for each product reference
    const productIds = productsData.results.map(p => p.product.id);
    
    if (productIds.length === 0) {
      return res.status(200).json({ products: [] });
    }

    // Fetch product projections for these IDs
    const whereClause = productIds.map(id => `"${id}"`).join(',');
    const productProjectionsRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?where=id%20in%20(${encodeURIComponent(whereClause)})&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    if (!productProjectionsRes.ok) {
      console.error('Failed to fetch product projections:', productProjectionsRes.status);
      return res.status(200).json({ products: [] });
    }

    const projectionsData = await productProjectionsRes.json();

    const products = projectionsData.results.map(p => ({
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