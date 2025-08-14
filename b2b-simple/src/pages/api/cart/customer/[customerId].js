export default async function handler(req, res) {
  const { customerId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cart/auth`);
    const { token } = await authRes.json();

    const response = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/carts?where=customerId="${customerId}" and cartState="Active"&sort=lastModifiedAt desc&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to get customer cart' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}