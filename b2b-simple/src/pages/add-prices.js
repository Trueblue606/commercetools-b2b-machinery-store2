export default function AddPrices({ result }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Add Embedded Prices (GBP)</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export async function getServerSideProps() {
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

    const prodRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/products?limit=1',
      {
        headers: {
          Authorization: 'Bearer ' + auth.access_token,
        },
      }
    );

    const data = await prodRes.json();
    const product = data.results[0];

    if (!product) {
      return { props: { result: 'No products found' } };
    }

    const updateRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/products/' +
        product.id,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + auth.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: product.version,
          actions: [
            {
              action: 'setPrices',
              variantId: 1,
              prices: [
                {
                  value: {
                    currencyCode: 'GBP',
                    centAmount: 10000, // £100.00
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const updateResult = await updateRes.json();

    return {
      props: {
        result: {
          productName:
            product.masterData?.current?.name?.['en-GB'] || 'Unknown',
          updateStatus: updateRes.ok ? 'Success' : 'Failed',
          response: updateResult,
        },
      },
    };
  } catch (error) {
    return { props: { result: { error: error.message } } };
  }
}
