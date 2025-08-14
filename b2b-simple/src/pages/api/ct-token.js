export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authRes = await fetch(
      `https://auth.${process.env.CT_REGION}.aws.commercetools.com/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.CT_CLIENT_ID}:${process.env.CT_CLIENT_SECRET}`
            ).toString('base64')
        },
        body: `grant_type=client_credentials&scope=manage_project:${process.env.CT_PROJECT_KEY}`
      }
    );

    if (!authRes.ok) {
      const err = await authRes.text();
      return res.status(authRes.status).json({ error: err });
    }

    const data = await authRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
