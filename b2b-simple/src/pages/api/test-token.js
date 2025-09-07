import { getCTToken } from "@/lib/ctAuth";

const PROJECT_KEY = process.env.CT_PROJECT_KEY;
const REGION = process.env.CT_REGION || 'eu-central-1';
const API_BASE = `https://api.${REGION}.aws.commercetools.com/${PROJECT_KEY}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      shippingAddress,
      billingAddress,
      customerEmail,
      customerId,   // Pass this from frontend login
      orderNotes
    } = req.body;

    // Auth token (works like your login.js)
    const AUTH_TOKEN = await getCTToken(req, req.headers['x-ct-token']);

    const cartPayload = {
      currency: 'GBP',
      country: 'GB',
      customerEmail,
      customerId: customerId || undefined,
      shippingAddress,
      billingAddress
    };

    const createCartResponse = await fetch(`${API_BASE}/carts`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cartPayload)
    });

    if (!createCartResponse.ok) {
      throw new Error(await createCartResponse.text());
    }

    const cart = await createCartResponse.json();

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return res.status(201).json({
      success: true,
      id: cart.id,
      orderNumber,
      customerEmail,
      totalPrice: cart.totalPrice || { currencyCode: 'GBP', centAmount: 0 },
      shippingAddress,
      billingAddress,
      orderNotes,
      createdAt: cart.createdAt,
      status: 'pending'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
