import { ClientBuilder } from '@commercetools/sdk-client-v2';
import fetch from 'node-fetch';

function createClient() {
  return new ClientBuilder()
    .withProjectKey(process.env.CT_PROJECT_KEY)
    .withClientCredentialsFlow({
      host: process.env.CT_AUTH_URL,
      projectKey: process.env.CT_PROJECT_KEY,
      credentials: {
        clientId: process.env.CT_CLIENT_ID,
        clientSecret: process.env.CT_CLIENT_SECRET,
      },
      fetch
    })
    .withHttpMiddleware({
      host: process.env.CT_API_URL,
      fetch
    })
    .withLoggerMiddleware()
    .build();
}

export default async function handler(req, res) {
  const { customerId } = req.query;

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }

  try {
    const client = createClient();
    const response = await client.execute({
      uri: `/${process.env.CT_PROJECT_KEY}/shopping-lists?where=customer(id="${customerId}")&expand=lineItems[*].product`,
      method: 'GET'
    });

    // Ensure JSON output
    if (!response.body || typeof response.body !== 'object') {
      console.error('Unexpected API response', response);
      return res.status(500).json({ error: 'Unexpected API response format' });
    }

    res.status(200).json(response.body);
  } catch (error) {
    console.error('Commercetools shopping list fetch failed:', error);

    // Return a safe JSON error instead of HTML
    res.status(500).json({
      error: 'Failed to fetch shopping list',
      details: error.message || 'Unknown error',
    });
  }
}
