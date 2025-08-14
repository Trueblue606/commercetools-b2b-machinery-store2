export default async function handler(req, res) {
  try {
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

    const auth = await authRes.json();
    res.status(200).json({ token: auth.access_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
