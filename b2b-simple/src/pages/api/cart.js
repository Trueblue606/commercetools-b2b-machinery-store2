export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, customerGroupId, currency = 'GBP' } = req.body;

    // Get token from auth endpoint
    const authRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cart/auth`);
    const { token } = await authRes.json();

    // Build cart payload
    const cartPayload = {
      currency,
      lineItems: []
    };

    if (customerId) {
      cartPayload.customerId = customerId;
    } else {
      const anonymousId = 'anon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      cartPayload.anonymousId = anonymousId;
    }

    if (customerGroupId) {
      cartPayload.customerGroup = {
        typeId: 'customer-group',
        id: customerGroupId
      };
    }

    // Create cart with price selection for customer group
    const queryParams = new URLSearchParams({
      priceCurrency: currency,
      priceCountry: 'GB',
      ...(customerGroupId && { priceCustomerGroup: customerGroupId })
    }).toString();

    const response = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/carts?${queryParams}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartPayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Failed to create cart' });
    }

    const cart = await response.json();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
