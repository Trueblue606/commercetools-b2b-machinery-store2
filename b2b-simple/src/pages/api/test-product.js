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

    // Fetch product projection by ID
    const productRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/${id}?expand=masterVariant.prices[*].customerGroup,masterVariant.images`,
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

    return res.status(200).json(productData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
