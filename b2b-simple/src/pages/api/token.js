// pages/api/token.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUrl = `https://auth.${process.env.CT_REGION}.aws.commercetools.com/oauth/token`;
    const authString = Buffer.from(
      `${process.env.CT_CLIENT_ID}:${process.env.CT_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch(authUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&scope=manage_project:${process.env.CT_PROJECT_KEY}`
    });

    if (!tokenRes.ok) {
      throw new Error(`Token request failed with ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    res.status(200).json(tokenData);
  } catch (err) {
    console.error('Token fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
}
