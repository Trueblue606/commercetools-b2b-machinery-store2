export default function FixAllPrices({ results }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Adding Prices to All Products (GBP)</h1>
      <div style={{ marginBottom: '20px' }}>
        <p>Total products: {results.length}</p>
        <p>Successful: {results.filter((r) => r.success).length}</p>
        <p>Failed: {results.filter((r) => !r.success).length}</p>
      </div>
      {results.map((result, i) => (
        <div
          key={i}
          style={{
            padding: '10px',
            margin: '5px 0',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            borderRadius: '4px',
          }}
        >
          <strong>{result.name}</strong> - {result.success ? 'Success' : 'Failed'}
          {result.error && (
            <p style={{ color: 'red', fontSize: '12px' }}>{result.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps() {
  const results = [];

  try {
    // Get token
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
    const token = auth.access_token;

    // Get ALL products
    const prodRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/products?limit=100',
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      }
    );

    const data = await prodRes.json();

    // Update each product
    for (const product of data.results) {
      try {
        const productName =
          product.masterData?.current?.name?.['en-GB'] || 'Unknown';

        // Set base price based on product type
        let basePrice = 50000; // £500.00 default
        if (productName.toLowerCase().includes('excavator')) {
          basePrice = 250000; // £2500.00
        } else if (productName.toLowerCase().includes('filter')) {
          basePrice = 10000; // £100.00
        } else if (productName.toLowerCase().includes('loader')) {
          basePrice = 200000; // £2000.00
        }

        // Update product with prices
        const updateRes = await fetch(
          'https://api.eu-central-1.aws.commercetools.com/chempilot/products/' +
            product.id,
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: product.version,
              actions: [
                {
                  action: 'setPrices',
                  variantId: 1,
                  prices: [
                    // Base price for non-logged in users
                    {
                      value: {
                        currencyCode: 'GBP',
                        centAmount: basePrice,
                      },
                    },
                    // Retail price (5% discount)
                    {
                      value: {
                        currencyCode: 'GBP',
                        centAmount: Math.floor(basePrice * 0.95),
                      },
                      customerGroup: {
                        typeId: 'customer-group',
                        key: 'retail',
                      },
                    },
                    // Wholesale price (15% discount)
                    {
                      value: {
                        currencyCode: 'GBP',
                        centAmount: Math.floor(basePrice * 0.85),
                      },
                      customerGroup: {
                        typeId: 'customer-group',
                        key: 'wholesale',
                      },
                    },
                  ],
                },
                // Publish immediately
                {
                  action: 'publish',
                },
              ],
            }),
          }
        );

        if (updateRes.ok) {
          results.push({ name: productName, success: true });
        } else {
          const error = await updateRes.text();
          results.push({ name: productName, success: false, error });
        }
      } catch (error) {
        results.push({
          name: product.masterData?.current?.name?.['en-GB'] || 'Unknown',
          success: false,
          error: error.message,
        });
      }
    }

    return { props: { results } };
  } catch (error) {
    return {
      props: {
        results: [{ name: 'System Error', success: false, error: error.message }],
      },
    };
  }
}
