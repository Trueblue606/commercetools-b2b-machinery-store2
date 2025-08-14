import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { COLORS } from '../account';
import { useCart } from '../contexts/CartContext';

// Customer Group IDs (from your project)
const GROUPS = {
  CONTRACT: 'b2b1bafe-e36b-4d95-93c5-82ea07d7e159',
  ASM: '48627f63-30a3-47d8-8d3d-4b1c30787a8a',
  CATALOGUE: '5db880e5-3e15-4cc0-9cd1-2b214dd53f23',
};

// Single source of truth for group info
function getCustomerGroupInfo(customer) {
  const activeGroupId =
    customer?.effectiveGroupId || // prefer what your /api/login returns
    customer?.customerGroup?.id ||
    null;

  if (activeGroupId === GROUPS.CONTRACT) {
    return { id: activeGroupId, key: 'contract', label: 'Contract', badgeColor: '#10b981' };
  }
  if (activeGroupId === GROUPS.ASM) {
    return { id: activeGroupId, key: 'asm', label: 'ASM', badgeColor: COLORS.BABY_BLUE };
  }
  if (activeGroupId === GROUPS.CATALOGUE) {
    return { id: activeGroupId, key: 'catalogue', label: 'Catalogue', badgeColor: '#6b7280' };
  }
  // Fallback when no group or unknown id
  return { id: null, key: 'catalogue', label: 'Catalogue', badgeColor: '#6b7280' };
}

// Price helper that uses the active group id first, then base price
function getPriceByCustomer(prices, customer) {
  if (!Array.isArray(prices) || prices.length === 0) return 'Contact for price';

  const { id: activeGroupId } = getCustomerGroupInfo(customer);

  if (activeGroupId) {
    const groupPrice = prices.find(p => p?.customerGroup?.id === activeGroupId);
    if (groupPrice) {
      const pv = groupPrice.discounted?.value || groupPrice.value;
      return `${pv.currencyCode} ${(pv.centAmount / 100).toFixed(2)}`;
    }
  }

  const basePrice = prices.find(p => !p.customerGroup);
  if (basePrice) {
    const pv = basePrice.discounted?.value || basePrice.value;
    return `${pv.currencyCode} ${(pv.centAmount / 100).toFixed(2)}`;
  }

  return 'Contact for price';
}

export default function DashboardContent({ customer, orders = [], onTabChange }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [savedProducts, setSavedProducts] = useState([]);
  const [reordering, setReordering] = useState({});

  const customerFirstName = customer?.firstName || 'there';
  const safeOrders = Array.isArray(orders) ? orders : [];
  const recentOrders = safeOrders.slice(0, 3);
useEffect(() => {
  function syncSavedProducts() {
    let userId = customer?.id;
    if (!userId) {
      userId = localStorage.getItem('guestId');
      if (!userId) {
        userId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem('guestId', userId);
      }
    }
    const storageKey = `savedProducts_${userId}`;
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    setSavedProducts(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
  }

  // Initial load
  syncSavedProducts();

  // Listen for saved list changes
  window.addEventListener('storage', syncSavedProducts);

  return () => window.removeEventListener('storage', syncSavedProducts);
}, [customer]);

  // Read saved products from localStorage safely
// Read saved products from localStorage safely (per user/guest)
useEffect(() => {
  try {
    let userId = customer?.id;
    if (!userId) {
      userId = localStorage.getItem('guestId');
      if (!userId) {
        userId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem('guestId', userId);
      }
    }
    const storageKey = `savedProducts_${userId}`;

    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    setSavedProducts(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
  } catch {
    setSavedProducts([]);
  }
}, [customer]);


  const thisMonthOrders = safeOrders.filter(order => {
    const d = new Date(order.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlySpend = thisMonthOrders.reduce((sum, o) => sum + (o.totalPrice?.centAmount || 0), 0) / 100;

  const formatOrderStatus = (orderState) => {
    const statusMap = {
      Open: { label: 'Processing', color: COLORS.BABY_BLUE },
      Complete: { label: 'Delivered', color: '#10b981' },
      Confirmed: { label: 'Confirmed', color: COLORS.BABY_BLUE },
      Cancelled: { label: 'Cancelled', color: '#ef4444' },
    };
    return statusMap[orderState] || { label: orderState || 'Unknown', color: '#6b7280' };
  };

  const handleQuickReorder = async (order) => {
    const orderId = order.id;
    setReordering(prev => ({ ...prev, [orderId]: true }));
    try {
      if (Array.isArray(order.lineItems) && order.lineItems.length > 0) {
        for (const item of order.lineItems) {
          await addToCart(item.productId, item.variant?.id || 1, item.quantity);
        }
        alert(`✅ ${order.lineItems.length} items from Order #${order.orderNumber} added to cart!`);
      } else {
        alert('No items found in this order to reorder.');
      }
    } catch (err) {
      console.error('Quick reorder failed:', err);
      alert('Failed to reorder items. Please try again.');
    } finally {
      setReordering(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAddSavedToCart = async (product) => {
    const productId = product.id;
    setReordering(prev => ({ ...prev, [`saved-${productId}`]: true }));
    try {
      await addToCart(product.id, 1, 1);
      alert(`✅ ${product.name} added to cart!`);
    } catch (err) {
      console.error('Failed to add saved product to cart:', err);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setReordering(prev => ({ ...prev, [`saved-${productId}`]: false }));
    }
  };

  // Savings based on active group (Contract = 15%, ASM = 5%, Catalogue = 0)
  const calculateTotalSavings = () => {
    const { key } = getCustomerGroupInfo(customer);
    const rate = key === 'contract' ? 0.15 : key === 'asm' ? 0.05 : 0;
    return safeOrders.reduce((acc, o) => acc + ((o.totalPrice?.centAmount || 0) / 100) * rate, 0);
  };

  const actualSavings = calculateTotalSavings();

  const customerBenefits = (() => {
    const info = getCustomerGroupInfo(customer);
    if (info.key === 'contract') {
      return {
        name: 'Contract',
        tier: 'Premium',
        color: COLORS.BABY_BLUE,
        topBenefits: [
          { icon: '💰', title: 'Volume Discounts', description: 'Up to 25% off bulk orders' },
          { icon: '🚚', title: 'Free Shipping', description: 'On orders over £500' },
          { icon: '📞', title: 'Dedicated Support', description: 'Priority customer service' },
        ],
        totalSavings: actualSavings,
      };
    }
    if (info.key === 'asm') {
      return {
        name: 'ASM',
        tier: 'Premium',
        color: COLORS.BABY_BLUE,
        topBenefits: [
          { icon: '💳', title: 'ASM Pricing', description: '5–10% off regular prices' },
          { icon: '🎯', title: 'Targeted Offers', description: 'Personalized recommendations' },
          { icon: '📦', title: 'Premium Shipping', description: 'Reliable delivery options' },
        ],
        totalSavings: actualSavings,
      };
    }
    return {
      name: 'Catalogue',
      tier: 'Standard',
      color: '#6b7280',
      topBenefits: [
        { icon: '🛍️', title: 'Shopping Access', description: 'Browse our full catalog' },
        { icon: '💬', title: 'Fast Shipping', description: 'Delivery is faster' },
        { icon: '🎯', title: 'Offers/Discounts', description: 'On select products' },
      ],
      totalSavings: 0,
    };
  })();

  const groupInfo = getCustomerGroupInfo(customer);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: "'Outfit', sans-serif",
      padding: '40px 0',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              Welcome, {customerFirstName}
            </h1>
            <span
              title={`${groupInfo.label} pricing active`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: '#0d2340',
                backgroundColor: COLORS.BABY_BLUE,
              }}
            >
              🎯 {groupInfo.label} Pricing
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 16, marginTop: 6 }}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32,
          padding: '24px 0',
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: 40,
        }}>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              {thisMonthOrders.length}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Orders this month</p>
          </div>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              £{monthlySpend.toFixed(0)}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Monthly spend</p>
          </div>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              {Array.isArray(savedProducts) ? savedProducts.length : 0}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Saved products</p>
          </div>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              £{customerBenefits.totalSavings.toFixed(0)}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Total saved</p>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 64, alignItems: 'start' }}>
          {/* Left column */}
          <div>
            {/* Recent orders */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.DARK_BLUE, marginBottom: 24 }}>
                Recent Orders
              </h2>

              {recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#f9fafb', borderRadius: 12 }}>
                  <div style={{ fontSize: 48, color: '#9ca3af', marginBottom: 16 }}>📦</div>
                  <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 24 }}>No orders yet</p>
                  <button
                    onClick={() => router.push('/')}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: COLORS.DARK_BLUE,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {recentOrders.map(order => {
                    const status = formatOrderStatus(order.orderState);
                    const isReordering = reordering[order.id];

                    return (
                      <div
                        key={order.id}
                        style={{
                          padding: 24,
                          backgroundColor: '#f9fafb',
                          borderRadius: 12,
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div
                            style={{ cursor: 'pointer', flex: 1 }}
                            onClick={() => router.push(`/account/orders/${order.id}`)}
                          >
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 8 }}>
                              Order #{order.orderNumber}
                            </h3>
                            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                              {new Date(order.createdAt).toLocaleDateString('en-GB')}
                            </p>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500,
                                backgroundColor: status.color,
                                color: COLORS.DARK_BLUE,
                              }}
                            >
                              {status.label}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                            <div>
                              <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.DARK_BLUE, marginBottom: 4 }}>
                                £{((order.totalPrice?.centAmount || 0) / 100).toFixed(2)}
                              </p>
                              <p style={{ fontSize: 14, color: '#6b7280' }}>
                                {order.lineItems?.length || 0} items
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickReorder(order);
                              }}
                              disabled={isReordering}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: isReordering ? '#9ca3af' : COLORS.DARK_BLUE,
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isReordering ? 'not-allowed' : 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              {isReordering ? (
                                <>
                                  <div
                                    style={{
                                      width: 12,
                                      height: 12,
                                      border: '2px solid #ffffff',
                                      borderTop: '2px solid transparent',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite',
                                    }}
                                  />
                                  Reordering...
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                    <path d="M8 16H3v5" />
                                  </svg>
                                  Reorder
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {safeOrders.length > 3 && (
                    <button
                      onClick={() => onTabChange('orders')}
                      style={{
                        padding: 16,
                        backgroundColor: '#ffffff',
                        color: COLORS.DARK_BLUE,
                        border: `1px solid ${COLORS.BABY_BLUE}`,
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.BABY_BLUE)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      View all {safeOrders.length} orders →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Saved Products */}
            {Array.isArray(savedProducts) && savedProducts.length > 0 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.DARK_BLUE, marginBottom: 24 }}>
                  Saved Products
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savedProducts.map((product) => {
                    const isAdding = reordering[`saved-${product.id}`];
                    const priceText = getPriceByCustomer(product.prices, customer);

                    return (
                      <div
                        key={product.id}
                        style={{
                          padding: 16,
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        {/* Image */}
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            backgroundColor: '#ffffff',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
                            />
                          ) : (
                            <div style={{ color: '#9ca3af', fontSize: 24 }}>📦</div>
                          )}
                        </div>

                        {/* Info */}
                        <div
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => router.push(`/product/${product.id}`)}
                        >
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 4 }}>
                            {product.name}
                          </h4>
                          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                            SKU: {product.sku || 'N/A'}
                          </p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.DARK_BLUE }}>{priceText}</p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSavedToCart(product);
                          }}
                          disabled={isAdding}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: isAdding ? '#9ca3af' : COLORS.DARK_BLUE,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isAdding ? 'not-allowed' : 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isAdding ? (
                            <>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  border: '2px solid #ffffff',
                                  borderTop: '2px solid transparent',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                }}
                              />
                              Adding...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                              Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div>
            {/* Benefits */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.DARK_BLUE }}>Your Benefits</h3>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: COLORS.BABY_BLUE,
                    color: '#0d2340',
                  }}
                >
                  {customerBenefits.tier}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {customerBenefits.topBenefits.map((benefit, i) => (
                  <div key={i} style={{ padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: COLORS.BABY_BLUE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {benefit.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 2 }}>
                        {benefit.title}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 16 }}>Quick Actions</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: COLORS.DARK_BLUE,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Browse Products
                </button>

                <button
                  onClick={() => onTabChange('orders')}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: '#ffffff',
                    color: COLORS.DARK_BLUE,
                    border: `1px solid ${COLORS.BABY_BLUE}`,
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.BABY_BLUE)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  View All Orders
                </button>
              </div>
            </div>

            {/* Support */}
            <div style={{ padding: 20, backgroundColor: '#f9fafb', borderRadius: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 8 }}>Need Help?</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                Our support team is available to assist with any questions.
              </p>
              <a
                href="mailto:support@example.com"
                style={{ fontSize: 13, color: COLORS.DARK_BLUE, textDecoration: 'none', fontWeight: 600 }}
              >
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
