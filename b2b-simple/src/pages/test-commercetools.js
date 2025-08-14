// pages/test-commercetools.js
// Direct test to check product data in Commercetools
import { useState } from 'react';

export default function TestCommercetools() {
  const [productId, setProductId] = useState('a5d684de-54b3-4a27-876e-21de51ed1090');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testDirectAPI = async () => {
    setLoading(true);
    setResults({});
    
    try {
      // Get token first
      const tokenRes = await fetch('/api/cart/auth');
      const { token } = await tokenRes.json();
      
      // Test 1: Product Projections endpoint
      const projectionRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/${productId}?priceCurrency=GBP&priceCountry=GB`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const projectionData = await projectionRes.json();
      
      // Test 2: Products endpoint (master data)
      const productRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const productData = await productRes.json();
      
      // Test 3: Search for product to see if prices show there
      const searchRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/search?filter=id:"${productId}"&priceCurrency=GBP`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const searchData = await searchRes.json();
      
      setResults({
        projection: projectionData,
        product: productData,
        search: searchData
      });
      
      console.log('All results:', {
        projection: projectionData,
        product: productData,
        search: searchData
      });
      
    } catch (error) {
      console.error('Error:', error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkPrices = (data, source) => {
    let prices = [];
    
    // Check different possible locations for prices
    if (source === 'projection') {
      prices = data?.masterVariant?.prices || [];
    } else if (source === 'product') {
      prices = data?.masterData?.current?.masterVariant?.prices || 
               data?.masterData?.staged?.masterVariant?.prices || [];
    } else if (source === 'search') {
      prices = data?.results?.[0]?.masterVariant?.prices || [];
    }
    
    return prices.length > 0 ? (
      <div style={{ color: 'green' }}>
        ✓ Found {prices.length} price(s):
        {prices.map((p, i) => (
          <div key={i} style={{ marginLeft: '20px', fontSize: '12px' }}>
            {p.value?.currencyCode} {(p.value?.centAmount / 100).toFixed(2)} 
            {p.country && ` (${p.country})`}
          </div>
        ))}
      </div>
    ) : (
      <div style={{ color: 'red' }}>✗ No prices found</div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Direct Commercetools API Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
          style={{ width: '400px', padding: '5px', marginRight: '10px' }}
        />
        <button 
          onClick={testDirectAPI}
          disabled={loading}
          style={{ padding: '5px 15px' }}
        >
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </button>
      </div>
      
      {results.projection && (
        <div style={{ marginBottom: '20px' }}>
          <h3>1. Product Projections Endpoint</h3>
          {checkPrices(results.projection, 'projection')}
          <details>
            <summary>View Data</summary>
            <pre style={{ fontSize: '10px', backgroundColor: '#f0f0f0', padding: '10px' }}>
              {JSON.stringify(results.projection, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {results.product && (
        <div style={{ marginBottom: '20px' }}>
          <h3>2. Products Endpoint (Master Data)</h3>
          <div>Current version published: {results.product?.masterData?.current ? 'Yes' : 'No'}</div>
          <div>Staged version exists: {results.product?.masterData?.staged ? 'Yes' : 'No'}</div>
          <div>Current prices: {checkPrices(results.product, 'product')}</div>
          <details>
            <summary>View Data</summary>
            <pre style={{ fontSize: '10px', backgroundColor: '#f0f0f0', padding: '10px' }}>
              {JSON.stringify(results.product, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {results.search && (
        <div style={{ marginBottom: '20px' }}>
          <h3>3. Search Endpoint</h3>
          <div>Results found: {results.search?.results?.length || 0}</div>
          {results.search?.results?.length > 0 && checkPrices(results.search, 'search')}
          <details>
            <summary>View Data</summary>
            <pre style={{ fontSize: '10px', backgroundColor: '#f0f0f0', padding: '10px' }}>
              {JSON.stringify(results.search, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {results.error && (
        <div style={{ color: 'red' }}>
          Error: {results.error}
        </div>
      )}
    </div>
  );
}