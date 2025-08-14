// pages/debug-customer-group.js - Check customer group mismatch
import { useState } from 'react';

export default function DebugCustomerGroup() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkCustomerGroup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const customer = JSON.parse(localStorage.getItem('customer') || '{}');
      const authRes = await fetch('/api/auth');
      const { token } = await authRes.json();

      console.log('=== CHECKING CUSTOMER GROUP ===');
      
      // Get customer details from commercetools
      const customerRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/customers/${customer.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const customerData = await customerRes.json();
      console.log('Customer data from commercetools:', customerData);

      // Get all customer groups
      const groupsRes = await fetch(
        'https://api.eu-central-1.aws.commercetools.com/chempilot/customer-groups',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const groupsData = await groupsRes.json();
      console.log('All customer groups:', groupsData);

      setResult({
        success: true,
        customer: {
          id: customerData.id,
          email: customerData.email,
          customerGroup: customerData.customerGroup,
          customerGroupFromLocalStorage: customer.customerGroup
        },
        allGroups: groupsData.results,
        analysis: {
          customerGroupId: customerData.customerGroup?.id,
          groupName: groupsData.results.find(g => g.id === customerData.customerGroup?.id)?.name,
          expectedId: '48627f63-30a3-47d8-8d3d-4b1c30787a8a',
          match: customerData.customerGroup?.id === '48627f63-30a3-47d8-8d3d-4b1c30787a8a'
        }
      });

    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testWithNoCustomerGroup = async () => {
    setLoading(true);
    
    try {
      const authRes = await fetch('/api/auth');
      const { token } = await authRes.json();

      console.log('=== TESTING ANONYMOUS CART (NO CUSTOMER GROUP) ===');

      // Create cart without customer
      const cartData = {
        currency: 'GBP'
      };

      const createRes = await fetch(
        'https://api.eu-central-1.aws.commercetools.com/chempilot/carts',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartData),
        }
      );

      const cart = await createRes.json();
      
      if (!createRes.ok) {
        setResult({ success: false, error: 'Failed to create anonymous cart', details: cart });
        return;
      }

      // Try to add item to anonymous cart
      const updateData = {
        version: cart.version,
        actions: [{
          action: 'addLineItem',
          sku: 'oil-filter',
          quantity: 1
        }]
      };

      const updateRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/carts/${cart.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      const updatedCart = await updateRes.json();

      if (updateRes.ok) {
        setResult({
          success: true,
          message: 'Anonymous cart works! The issue is customer group specific.',
          cart: updatedCart,
          suggestion: 'Either add a price for "all customer groups" or check customer group assignment'
        });
      } else {
        setResult({
          success: false,
          error: 'Anonymous cart also failed',
          details: updatedCart,
          suggestion: 'Need to add pricing without customer group restriction'
        });
      }

    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1>🔍 Debug Customer Group vs Pricing</h1>
      
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
        <h3>🤔 The Issue:</h3>
        <p>Your product pricing is set for customer group "wholesale", but commercetools is looking for a specific customer group ID that might not match.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={checkCustomerGroup}
          disabled={loading}
          style={{
            padding: '16px 24px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Checking...' : '🔍 Check Customer Group Details'}
        </button>

        <button
          onClick={testWithNoCustomerGroup}
          disabled={loading}
          style={{
            padding: '16px 24px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : '🧪 Test Anonymous Cart'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '24px',
          backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
          color: result.success ? '#065f46' : '#dc2626',
          borderRadius: '12px',
          fontFamily: 'monospace'
        }}>
          <h3>{result.success ? '✅ RESULTS' : '❌ ERROR'}</h3>
          
          {result.customer && (
            <div style={{ marginBottom: '16px' }}>
              <h4>Customer Group Analysis:</h4>
              <ul>
                <li>Customer Group ID: {result.analysis.customerGroupId}</li>
                <li>Group Name: {result.analysis.groupName}</li>
                <li>Expected ID: {result.analysis.expectedId}</li>
                <li>Match: {result.analysis.match ? '✅ YES' : '❌ NO'}</li>
              </ul>
            </div>
          )}

          {result.message && <p><strong>Message:</strong> {result.message}</p>}
          {result.error && <p><strong>Error:</strong> {result.error}</p>}
          {result.suggestion && <p><strong>Suggestion:</strong> {result.suggestion}</p>}
          
          {result.allGroups && (
            <details style={{ marginTop: '16px' }}>
              <summary>All Customer Groups</summary>
              <pre style={{ fontSize: '12px', marginTop: '8px' }}>
                {JSON.stringify(result.allGroups, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div style={{ marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
        <h4>💡 Possible Solutions:</h4>
        <ol>
          <li><strong>Add price for all customer groups:</strong> In commercetools, add another price for the product without customer group restriction</li>
          <li><strong>Check customer group assignment:</strong> Make sure your customer is assigned to the correct "wholesale" group</li>
          <li><strong>Update existing price:</strong> Change the existing price from "wholesale" to "all customer groups"</li>
        </ol>
      </div>
    </div>
  );
}