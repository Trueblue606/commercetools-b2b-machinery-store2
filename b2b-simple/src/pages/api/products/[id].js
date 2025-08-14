// pages/api/products/[id].js - Fixed to include prices
export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id in query' });
  }

  try {
    // Get access token
    const authRes = await fetch(
      'https://auth.eu-central-1.aws.commercetools.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(
              '8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y'
            ).toString('base64'),
        },
        body: 'grant_type=client_credentials',
      }
    );

    if (!authRes.ok) {
      const error = await authRes.text();
      return res.status(authRes.status).json({ error });
    }

    const authData = await authRes.json();

    // Fetch product projection with price parameters
    const productRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/${id}?priceCurrency=GBP&priceCountry=GB`,
      {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
        },
      }
    );

    if (!productRes.ok) {
      const error = await productRes.text();
      return res.status(productRes.status).json({ error });
    }

    const productData = await productRes.json();

    // The prices should already be in the response, but let's make sure
    console.log('Product API response:', {
      id: productData.id,
      name: productData.name?.['en-GB'],
      hasPrices: !!productData.masterVariant?.prices,
      priceCount: productData.masterVariant?.prices?.length || 0,
      prices: productData.masterVariant?.prices?.map(p => ({
        amount: p.value.centAmount,
        currency: p.value.currencyCode,
        country: p.country
      }))
    });

    return res.status(200).json(productData);
  } catch (err) {
    console.error('Product API error:', err);
    return res.status(500).json({ error: err.message });
  }
}