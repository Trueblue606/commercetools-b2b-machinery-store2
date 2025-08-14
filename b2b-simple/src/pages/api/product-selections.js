// pages/api/product-selections.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Fetch all product selections
    const selectionsRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/product-selections?limit=100',
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );

    if (!selectionsRes.ok) {
      console.error('Failed to fetch selections:', selectionsRes.status);
      return res.status(200).json({ selections: [] }); // Return empty array if no selections exist
    }

    const selectionsData = await selectionsRes.json();

    res.status(200).json({ 
      selections: selectionsData.results.map(selection => ({
        id: selection.id,
        key: selection.key,
        name: selection.name?.['en-GB'] || selection.name?.['en'] || selection.key || 'Unnamed Selection',
        productCount: selection.productCount || 0
      }))
    });
  } catch (error) {
    console.error('Error in product-selections API:', error);
    res.status(500).json({ error: 'Failed to fetch product selections' });
  }
}