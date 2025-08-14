// src/pages/api/cart/clear.js
export default async function handler(req, res) {
  // Accept POST (and DELETE as a convenience)
  if (!['POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // From POST body or DELETE query string
    const cartId =
      req.method === 'POST' ? req.body?.cartId : req.query?.cartId;
    let cartVersion =
      req.method === 'POST' ? req.body?.cartVersion : Number(req.query?.cartVersion);

    if (!cartId) {
      return res.status(400).json({ error: 'Missing cartId' });
    }

    // Get token
    const token = await getToken();

    // Always fetch latest cart to have up-to-date version + line items
    const cartRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/carts/${encodeURIComponent(
        cartId
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const cartText = await cartRes.text();
    if (!cartRes.ok) {
      return res.status(cartRes.status).json({ error: cartText || 'Failed to load cart' });
    }
    const cart = JSON.parse(cartText);

    // If empty already, just return it
    const items = Array.isArray(cart.lineItems) ? cart.lineItems : [];
    if (items.length === 0) {
      return res.status(200).json(cart);
    }

    // Remove all line items
    const actions = items.map((li) => ({
      action: 'removeLineItem',
      lineItemId: li.id,
    }));

    const updateRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/${process.env.CT_PROJECT_KEY}/carts/${encodeURIComponent(
        cartId
      )}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: cart.version, // use freshest version from the GET above
          actions,
        }),
      }
    );

    const updateText = await updateRes.text();
    if (!updateRes.ok) {
      return res.status(updateRes.status).json({ error: updateText || 'Failed to clear cart' });
    }

    const updatedCart = JSON.parse(updateText);
    return res.status(200).json(updatedCart);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function getToken() {
  const authUrl =
    process.env.CT_AUTH_URL || 'https://auth.eu-central-1.aws.commercetools.com/oauth/token';
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
