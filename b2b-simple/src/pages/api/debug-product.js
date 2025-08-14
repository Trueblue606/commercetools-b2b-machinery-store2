export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid product id query param' });
  }

  try {
    const authRes = await fetch('https://auth.eu-central-1.aws.commercetools.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from('8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y').toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });

    if (!authRes.ok) {
      const text = await authRes.text();
      return res.status(authRes.status).json({ error: 'Auth failed', details: text });
    }

    const authData = await authRes.json();
    const token = authData.access_token;

    const apiUrl = \`https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/\${encodeURIComponent(id)}?expand=masterVariant.prices%5B%2A%5D.customerGroup&expand=masterVariant.images\`;

    const productRes = await fetch(apiUrl, {
      headers: {
        Authorization: \`Bearer \${token}\`,
      },
    });

    if (!productRes.ok) {
      const text = await productRes.text();
      return res.status(productRes.status).json({ error: 'Product fetch failed', details: text });
    }

    const productData = await productRes.json();

    return res.status(200).json(productData);
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected error', details: error.message || String(error) });
  }
}
