// pages/cart.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { useCart } from './contexts/CartContext';

export default function Cart() {
  const { 
    cart, 
    loading, 
    error, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    selectedItemCount
  } = useCart();
  
  const [customer, setCustomer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) setCustomer(JSON.parse(stored));
  }, []);

  const lineItems = cart?.lineItems || [];
  const totalItems = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ===== PRICE CALCULATIONS =====
  const cc = cart?.totalPrice?.currencyCode || 'GBP';
  const selectedSubtotalCents = (selectedItems && selectedItems.size > 0)
    ? lineItems.reduce((sum, li) =>
        selectedItems.has(li.id)
          ? sum + (li.totalPrice?.centAmount || 0)
          : sum
      , 0)
    : (typeof cart?.totalPrice?.centAmount === 'number'
        ? cart.totalPrice.centAmount
        : lineItems.reduce((sum, li) => sum + (li.totalPrice?.centAmount || 0), 0)
      );

  const shippingCents = selectedSubtotalCents >= 50000 ? 0 : 2500;
  const formattedSubtotal = `${cc} ${(selectedSubtotalCents / 100).toFixed(2)}`;
  const formattedTotal    = `${cc} ${((selectedSubtotalCents + shippingCents) / 100).toFixed(2)}`;

  // ===== STATES =====
  if (loading) {
    return (
      <>
       
        <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTop: '4px solid #0d2340', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading cart...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
       
        <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Error Loading Cart</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', backgroundColor: '#0d2340', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Try Again</button>
          </div>
        </div>
      </>
    );
  }

  if (lineItems.length === 0) {
    return (
      <>
      
        <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0d2340', marginBottom: '32px' }}>Shopping Cart</h1>
            <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" style={{ margin: '0 auto 24px' }}>
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Your cart is empty</h2>
              <p style={{ color: '#6b7280', marginBottom: '32px' }}>Start shopping to add items to your cart</p>
              <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#0d2340', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== MAIN UI =====
  return (
    <>
   
      <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '32px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0d2340' }}>
                Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h1>
              {lineItems.length > 0 && (
                <button onClick={clearCart} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
                  Clear Cart
                </button>
              )}
            </div>

            {/* Selection Controls */}
            {lineItems.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={(selectedItems?.size || 0) === lineItems.length && lineItems.length > 0}
                    onChange={(e) => e.target.checked ? selectAllItems() : deselectAllItems()}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Select All Items
                </label>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {selectedItemCount} of {totalItems} items selected
                </span>
                {(selectedItems?.size || 0) > 0 && (selectedItems?.size || 0) < lineItems.length && (
                  <button onClick={deselectAllItems} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                    Clear Selection
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            
            {/* Cart Items */}
            <div>
              {lineItems.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', gap: '16px', padding: '24px',
                  backgroundColor: selectedItems?.has(item.id) ? '#f0f9ff' : '#f9fafb',
                  borderRadius: '12px', marginBottom: '16px',
                  border: selectedItems?.has(item.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '8px' }}>
                    <input type="checkbox" checked={selectedItems?.has(item.id) || false} onChange={() => toggleItemSelection(item.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </div>
                  <div style={{ width: '100px', height: '100px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.variant?.images?.[0]?.url ? (
                      <img src={item.variant.images[0].url} alt={item.name?.['en-GB'] || 'Product'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>No image</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0d2340', marginBottom: '8px' }}>
                      {item.name?.['en-GB'] || item.name?.['en'] || 'Product'}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                      SKU: {item.variant?.sku || 'N/A'} | Quantity: {item.quantity}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Qty:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                          <span style={{ fontSize: '16px', fontWeight: '600', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#0d2340', marginBottom: '8px' }}>
                          {cc} {((item.totalPrice?.centAmount || 0) / 100).toFixed(2)}
                        </p>
                        <button onClick={() => removeFromCart(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0d2340', marginBottom: '24px' }}>Order Summary</h2>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal ({selectedItemCount || totalItems} items)</span>
                  <span style={{ fontWeight: '600' }}>{formattedSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Shipping</span>
                  {shippingCents === 0 ? (
                    <span style={{ fontWeight: '600', color: '#10b981' }}>Free</span>
                  ) : (
                    <span style={{ fontWeight: '600' }}>{cc} {(shippingCents / 100).toFixed(2)}</span>
                  )}
                </div>
                {selectedSubtotalCents < 50000 && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                    Add {cc} {((50000 - selectedSubtotalCents) / 100).toFixed(2)} more for free shipping
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0d2340' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0d2340' }}>{formattedTotal}</span>
              </div>
              <button
                disabled={(selectedItemCount || 0) === 0 && !lineItems.length}
                style={{ width: '100%', padding: '16px', backgroundColor: ((selectedItemCount || 0) === 0 && !lineItems.length) ? '#9ca3af' : '#0d2340', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: ((selectedItemCount || 0) === 0 && !lineItems.length) ? 'not-allowed' : 'pointer', marginTop: '16px' }}
                onClick={() => { if ((selectedItemCount || 0) > 0 || lineItems.length) router.push('/checkout'); }}
              >
                Checkout ({selectedItemCount || totalItems} {(selectedItemCount || totalItems) === 1 ? 'item' : 'items'})
              </button>
              <Link href="/" style={{ display: 'block', textAlign: 'center', color: '#0d2340', textDecoration: 'none', fontSize: '14px', fontWeight: '500', marginTop: '12px' }}>
                ← Continue Shopping
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
