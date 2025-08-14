// lib/ctAuth.js
export async function getCommercetoolsToken({
  staticToken,                   // optional: e.g. req.headers['x-ct-token']
  region = process.env.CT_REGION || 'eu-central-1',
  clientId = process.env.CT_CLIENT_ID,
  clientSecret = process.env.CT_CLIENT_SECRET,
} = {}) {
  if (staticToken) {
    // Accept plain token or already-prefixed "Bearer ..."
    return staticToken.startsWith('Bearer ') ? staticToken : `Bearer ${staticToken}`;
  }

  if (!clientId || !clientSecret) {
    throw new Error('No commercetools token or client credentials provided');
  }

  const authRes = await fetch(`https://auth.${region}.aws.commercetools.com/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!authRes.ok) {
    throw new Error(`Auth failed: ${await authRes.text()}`);
  }

  const { access_token } = await authRes.json();
  return `Bearer ${access_token}`;
}
