import { useState, useEffect } from 'react';
import Navbar from './components/navbar';

export default function PriceTest({ product }) {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) {
      setCustomer(JSON.parse(stored));
    }
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <h1>Price Test - Air Filter</h1>
        
        <h2>Customer Info:</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify(customer, null, 2)}
        </pre>
        
        <h2>Product Prices:</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify(product.prices, null, 2)}
        </pre>
      </div>
    </>
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
          Authorization: `Basic ${Buffer.from(
            '8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y'
          ).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      }
    );
    
    const auth = await authRes.json();
    
    // Get just the Air Filter product
    const prodRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?limit=1',
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    );
    
    const data = await prodRes.json();
    const product = data.results[0];
    
    return { 
      props: { 
        product: {
          name: product.name['en-GB'] || product.name['en'],
          prices: product.masterVariant?.prices || []
        }
      } 
    };
  } catch (error) {
    return { props: { product: null } };
  }
}
