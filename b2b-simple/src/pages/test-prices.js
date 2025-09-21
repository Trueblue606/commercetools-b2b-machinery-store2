// pages/test-prices.js
// Debug page to test product prices
import { useState } from 'react';

export default function TestPrices() {
  const [productId, setProductId] = useState('a5d684de-54b3-4a27-876e-21de51ed1090');
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      setProductData(data);
      console.log('Full product data:', data);
      
      // Log price information
      if (data.masterVariant?.prices) {
        console.log('Master variant prices:', data.masterVariant.prices);
        const gbpPrices = data.masterVariant.prices.filter(p => p.value?.currencyCode === 'GBP');
        console.log('GBP prices found:', gbpPrices);
        
        if (gbpPrices.length > 0) {
          gbpPrices.forEach((price, index) => {
            console.log(`GBP Price ${index + 1}:`, {
              amount: price.value.centAmount,
              pounds: (price.value.centAmount / 100).toFixed(2),
              country: price.country || 'any',
              customerGroup: price.customerGroup || 'none',
              channel: price.channel || 'none'
            });
          });
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = () => {
    if (!productData?.masterVariant?.prices) return 'No prices found';
    
    const prices = productData.masterVariant.prices;
    const gbpPrices = prices.filter(p => p.value?.currencyCode === 'GBP');
    
    if (gbpPrices.length === 0) return 'No GBP prices found';
    
    return gbpPrices.map((price, index) => (
      <div key={index} style={{ 
        padding: '10px', 
        margin: '5px 0', 
        backgroundColor: '#f3f4f6',
        borderRadius: '4px'
      }}>
        <strong>Price {index + 1}:</strong> £{(price.value.centAmount / 100).toFixed(2)}
        <br />
        <small>
          Country: {price.country || 'Any'} | 
          Customer Group: {price.customerGroup?.id || 'None'} | 
          Channel: {price.channel?.id || 'None'}
        </small>
      </div>
    ));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Product Price Debugger</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
          style={{
            width: '400px',
            padding: '8px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={fetchProduct}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0a0a0a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch Product'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {productData && (
        <div>
          <h2>{productData.name?.['en-GB'] || productData.name?.['en'] || 'Product'}</h2>
          <p>SKU: {productData.masterVariant?.sku || 'N/A'}</p>
          
          <h3>Prices:</h3>
          {getPriceDisplay()}
          
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer' }}>View Raw Data</summary>
            <pre style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '10px', 
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(productData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}