export async function getProducts() {
  try {
    const response = await fetch(
      `${process.env.CTP_API_URL}/${process.env.CTP_PROJECT_KEY}/products`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error('Products fetch failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function getAccessToken() {
  const response = await fetch(
    `${process.env.CTP_AUTH_URL}/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.CTP_CLIENT_ID}:${process.env.CTP_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: `grant_type=client_credentials&scope=${process.env.CTP_SCOPES}`,
    }
  );
  
  const data = await response.json();
  return data.access_token;
}
