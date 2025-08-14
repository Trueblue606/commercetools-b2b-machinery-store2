// pages/check-price-groups.js
import { useState, useEffect } from 'react';

// Map customer group IDs to readable names
const CUSTOMER_GROUPS = {
  'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': 'Contract',
  '5db880e5-3e15-4cc0-9cd1-2b214dd53f23': 'Catalogue',
  '48627f63-30a3-47d8-8d3d-4b1c30787a8a': 'ASM'
};

// Simulate current logged-in user group (replace with session data)
const currentCustomerGroupId = 'b2b1bafe-e36b-4d95-93c5-82ea07d7e159'; // Contract

export default function CheckPriceGroups() {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);

  const productId = 'a5d684de-54b3-4a27-876e-21de51ed1090';

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      setProductData(data);

      if (data.masterVariant?.prices) {
        console.log('All prices with details:');
        data.masterVariant.prices.forEach((price, index) => {
          console.log(`Price ${index + 1}:`, {
            amount: `£${(price.value.centAmount / 100).toFixed(2)}`,
            currency: price.value.currencyCode,
            country: price.country || 'Any',
            customerGroup: price.customerGroup
              ? CUSTOMER_GROUPS[price.customerGroup.id] || price.customerGroup.id
              : 'None',
            channel: price.channel || 'None',
            validFrom: price.validFrom || 'Always',
            validUntil: price.validUntil || 'Always'
          });
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!productData) return <div>No data</div>;

  const prices = productData.masterVariant?.prices || [];

  // Price selection priority
  const getSelectedPrice = () => {
    if (!prices.length) return null;

    // 1️⃣ GBP + GB + current customer group
    let selected = prices.find(
      p =>
        p.value?.currencyCode === 'GBP' &&
        p.country === 'GB' &&
        p.customerGroup?.id === currentCustomerGroupId
    );

    // 2️⃣ GBP + any country + current customer group
    if (!selected) {
      selected = prices.find(
        p =>
          p.value?.currencyCode === 'GBP' &&
          !p.country &&
          p.customerGroup?.id === currentCustomerGroupId
      );
    }

    // 3️⃣ GBP + GB + no customer group
    if (!selected) {
      selected = prices.find(
        p =>
          p.value?.currencyCode === 'GBP' &&
          p.country === 'GB' &&
          !p.customerGroup
      );
    }

    // 4️⃣ GBP + no country + no customer group
    if (!selected) {
      selected = prices.find(
        p =>
          p.value?.currencyCode === 'GBP' &&
          !p.customerGroup &&
          !p.country
      );
    }

    // 5️⃣ Any GBP
    if (!selected) {
      selected = prices.find(p => p.value?.currencyCode === 'GBP');
    }

    return selected || null;
  };

  const selectedPrice = getSelectedPrice();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Price Analysis for Fuel Filter</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Price</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Customer Group</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Country</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Channel</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Valid Period</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price, index) => (
            <tr key={index}>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                £{(price.value.centAmount / 100).toFixed(2)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                {price.customerGroup ? (
                  <>
                    <strong>{CUSTOMER_GROUPS[price.customerGroup.id] || price.customerGroup.id}</strong>
                  </>
                ) : (
                  <span style={{ color: '#10b981' }}>✓ All Customers</span>
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                {price.country || 'All Countries'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                {price.channel ? price.channel.id : 'All Channels'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                {price.validFrom || price.validUntil ? (
                  <div style={{ fontSize: '12px' }}>
                    {price.validFrom && `From: ${new Date(price.validFrom).toLocaleDateString()}`}
                    {price.validFrom && price.validUntil && <br />}
                    {price.validUntil && `Until: ${new Date(price.validUntil).toLocaleDateString()}`}
                  </div>
                ) : (
                  'Always'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h3>Which price will be selected?</h3>
        <p>
          Priority:
        </p>
        <ol>
          <li>GBP price for GB with <strong>{CUSTOMER_GROUPS[currentCustomerGroupId]}</strong> group</li>
          <li>GBP price for any country with <strong>{CUSTOMER_GROUPS[currentCustomerGroupId]}</strong> group</li>
          <li>GBP price for GB with no group</li>
          <li>GBP price with no restrictions</li>
          <li>Any GBP price</li>
        </ol>

        {selectedPrice && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
            <strong>Currently selected: </strong>
            £{(selectedPrice.value.centAmount / 100).toFixed(2)}{' '}
            {selectedPrice.customerGroup
              ? `(Group: ${CUSTOMER_GROUPS[selectedPrice.customerGroup.id] || selectedPrice.customerGroup.id})`
              : '(No Restrictions)'}
          </div>
        )}
      </div>
    </div>
  );
}
