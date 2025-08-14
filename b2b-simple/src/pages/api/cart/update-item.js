// pages/api/cart/update-quantity.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cartId, cartVersion, lineItemId, quantity } = req.body;
    if (!cartId || typeof cartVersion !== 'number' || !lineItemId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid payload' });
    }

    const token = await getToken();

    const ctRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/carts/${cartId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: cartVersion,
          actions: [
            {
              action: 'changeLineItemQuantity',
              lineItemId,
              quantity,
            },
          ],
        }),
      }
    );

    const text = await ctRes.text();
    if (!ctRes.ok) {
      return res.status(ctRes.status).json({ error: text || 'Failed to update quantity' });
    }

    const updated = JSON.parse(text);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function getToken() {
  const authUrl = process.env.CT_AUTH_URL || 'https://auth.eu-central-1.aws.commercetools.com/oauth/token';
  const id = process.env.CT_CLIENT_ID;
  const secret = process.env.CT_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Missing CT credentials');

  const resp = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error_description || 'Auth failed');
  return json.access_token;
}
