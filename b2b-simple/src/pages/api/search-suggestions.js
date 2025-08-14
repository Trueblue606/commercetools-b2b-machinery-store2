// pages/api/search-suggestions.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q: query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(200).json({ suggestions: [] });
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

    // Get products for suggestions
    const productsRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?limit=100',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!productsRes.ok) {
      return res.status(200).json({ suggestions: [] });
    }

    const productsData = await productsRes.json();
    const queryLower = query.toLowerCase();
    const suggestions = new Set();

    // Extract suggestions from products
    productsData.results.forEach((product) => {
      const name = product.name['en-GB'] || product.name['en'] || '';
      const sku = product.masterVariant?.sku || '';
      
      if (name.toLowerCase().includes(queryLower)) {
        suggestions.add(name);
      }
      
      if (sku.toLowerCase().includes(queryLower)) {
        suggestions.add(sku);
      }
      
      // Add individual words that start with query
      const words = name.split(/\s+/).filter(word => 
        word.length > 2 && word.toLowerCase().startsWith(queryLower)
      );
      words.forEach(word => suggestions.add(word));
    });

    // Sort and limit suggestions
    const suggestionArray = Array.from(suggestions)
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(queryLower);
        const bStarts = b.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, 8);

    res.status(200).json({ suggestions: suggestionArray });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(200).json({ suggestions: [] });
  }
}