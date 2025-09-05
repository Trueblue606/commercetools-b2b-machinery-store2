// components/DashboardContent.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { COLORS } from '@/src/pages/account';
import { useCart } from '@/src/pages/contexts/CartContext';

// ---- shared group map (same as Navbar/PLP/PDP) ----
const groupMap = {
  'd7a14b96-ca48-4a3f-b35d-6bce624e3b16': { key: 'standard', label: 'Standard', badgeColor: '#6b7280' },
  'fc05910d-ec00-4d7a-abaa-967d352af9fc': { key: 'testoverlap', label: 'Test Overlap', badgeColor: '#3b82f6' },
  '68baca5b-b96b-4751-9f85-215fb1a7417c': { key: 'special', label: 'Special Project', badgeColor: '#8b5cf6' },
  'a1aff334-3def-4937-9116-5f2f96f93214': { key: 'distributor', label: 'Distributor', badgeColor: '#f59e0b' },
  '20304c81-f448-4c7e-9231-ba55488251e5': { key: 'contractA', label: 'Contract A', badgeColor: '#10b981' },
};

// ---- resolve active customer group ----
function resolveCustomerGroup(customer) {
  if (!customer) return { id: null, key: 'catalogue', label: 'Catalogue', badgeColor: '#6b7280' };

  const ids = [];
  if (customer.effectiveGroupId) ids.push(customer.effectiveGroupId);
  if (customer.customerGroup?.id) ids.push(customer.customerGroup.id);
  if (Array.isArray(customer.customerGroupAssignments)) {
    for (const a of customer.customerGroupAssignments) {
      const id = a?.customerGroup?.id || a?.id;
      if (id) ids.push(id);
    }
  }
  for (const id of ids) {
    if (groupMap[id]) return { id, ...groupMap[id] };
  }
  return { id: null, key: 'catalogue', label: 'Catalogue', badgeColor: '#6b7280' };
}

// ---- Price helper ----
function getPriceByCustomer(prices, customer) {
  if (!Array.isArray(prices) || prices.length === 0) return 'Contact for price';
  const { id: activeGroupId } = resolveCustomerGroup(customer);
  if (activeGroupId) {
    const gp = prices.find(p => p?.customerGroup?.id === activeGroupId);
    if (gp) {
      const v = gp.discounted?.value || gp.value;
      return `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`;
    }
  }
  const base = prices.find(p => !p.customerGroup);
  if (base) {
    const v = base.discounted?.value || base.value;
    return `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`;
  }
  return 'Contact for price';
}

export default function DashboardContent({ customer, orders: ordersProp = [], onTabChange }) {
  const router = useRouter();
  const { addToCart } = useCart();

  // --- NEW: fetch orders for this customer so Monthly spend is always calculated ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const stored = localStorage.getItem('customer');
        const c = stored ? JSON.parse(stored) : customer || null;
        const customerId = c?.id || customer?.id || '';

        // fall back to prop if no id
        if (!customerId) {
          setOrders(Array.isArray(ordersProp) ? ordersProp : []);
          setOrdersLoading(false);
          return;
        }

        const res = await fetch(`/api/orders/list?customerId=${encodeURIComponent(customerId)}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load orders');
        setOrders(Array.isArray(json.results) ? json.results : []);
      } catch (e) {
        setOrdersError(e.message || 'Failed to load orders');
        setOrders(Array.isArray(ordersProp) ? ordersProp : []);
      } finally {
        setOrdersLoading(false);
      }
    }
    loadOrders();
  }, [customer?.id]); // refetch when customer changes

  // Use fetched orders (falls back to prop already in effect above)
  const safeOrders = Array.isArray(orders) ? orders : [];
  const customerFirstName = customer?.firstName || 'there';

  // Spend & counts (exclude Cancelled from spend)
  const spendable = safeOrders.filter(o => o?.orderState !== 'Cancelled');
  const now = new Date();
  const thisMonthOrders = spendable.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlySpend = thisMonthOrders.reduce((sum, o) => sum + (o.totalPrice?.centAmount || 0), 0) / 100;

  // Recent (last 3 by createdAt desc)
  const recentOrders = [...safeOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const [savedProducts, setSavedProducts] = useState([]);
  const [reordering, setReordering] = useState({});

  useEffect(() => {
    function syncSavedProducts() {
      try {
        let userId = customer?.id || localStorage.getItem('guestId');
        if (!userId) {
          userId = `guest_${crypto.randomUUID()}`;
          localStorage.setItem('guestId', userId);
        }
        const storageKey = `savedProducts_${userId}`;
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedProducts(Array.isArray(parsed) ? parsed.slice(0, 3) : []);
      } catch {
        setSavedProducts([]);
      }
    }
    syncSavedProducts();
    window.addEventListener('storage', syncSavedProducts);
    return () => window.removeEventListener('storage', syncSavedProducts);
  }, [customer?.id]);

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
        alert(`✅ ${order.lineItems.length} items from Order #${order.orderNumber || order.id.slice(-8)} added to cart!`);
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

  const groupInfo = resolveCustomerGroup(customer);

  // Simple “savings” calculator (kept as-is)
  const calcSavings = () => {
    const rate =
      groupInfo.key === 'contractA' ? 0.15 :
      groupInfo.key === 'distributor' ? 0.10 :
      groupInfo.key === 'special' ? 0.08 :
      0;
    return spendable.reduce((acc, o) => acc + ((o.totalPrice?.centAmount || 0) / 100) * rate, 0);
  };
  const actualSavings = calcSavings();

  const customerBenefits = (() => {
    switch (groupInfo.key) {
      case 'contractA': return { name: 'Contract A', tier: 'Premium', color: groupInfo.badgeColor, topBenefits: [
        { icon: '💰', title: 'Volume Discounts', description: 'Up to 25% off bulk orders' },
        { icon: '🚚', title: 'Free Shipping', description: 'On orders over £500' },
        { icon: '📞', title: 'Dedicated Support', description: 'Priority customer service' },
      ], totalSavings: actualSavings };
      case 'distributor': return { name: 'Distributor', tier: 'Premium', color: groupInfo.badgeColor, topBenefits: [
        { icon: '🤝', title: 'Distributor Rates', description: 'Special partner pricing' },
        { icon: '🚀', title: 'Priority Fulfillment', description: 'Orders processed first' },
        { icon: '📊', title: 'Sales Reports', description: 'Detailed monthly insights' },
      ], totalSavings: actualSavings };
      case 'special': return { name: 'Special Project', tier: 'Custom', color: groupInfo.badgeColor, topBenefits: [
        { icon: '🛠️', title: 'Project Pricing', description: 'Tailored discounts for projects' },
        { icon: '⏱️', title: 'Flexible Terms', description: 'Adapted to project timelines' },
        { icon: '📦', title: 'Dedicated Stock', description: 'Reserved inventory for you' },
      ], totalSavings: actualSavings };
      default: return { name: 'Catalogue', tier: 'Standard', color: groupInfo.badgeColor, topBenefits: [
        { icon: '🛍️', title: 'Full Catalogue Access', description: 'Browse and shop our full range' },
        { icon: '💬', title: 'Fast Shipping', description: 'Quick delivery on stocked items' },
        { icon: '🎯', title: 'Seasonal Offers', description: 'Discounts on select products' },
      ], totalSavings: 0 };
    }
  })();

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '40px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>Welcome, {customerFirstName}</h1>
            <span title={`${groupInfo.label} pricing active`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#0d2340', backgroundColor: COLORS.BABY_BLUE }}>
              🎯 {groupInfo.label} Pricing
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 16, marginTop: 6 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, padding: '24px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: 40 }}>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              {ordersLoading ? '—' : thisMonthOrders.length}
            </p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Orders this month</p>
          </div>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: COLORS.DARK_BLUE, margin: 0 }}>
              {ordersLoading ? '—' : `£${monthlySpend.toFixed(2)}`}
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
              {ordersLoading ? '—' : `£${customerBenefits.totalSavings.toFixed(0)}`}
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

              {ordersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>Loading orders…</div>
              ) : recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#f9fafb', borderRadius: 12 }}>
                  <div style={{ fontSize: 48, color: '#9ca3af', marginBottom: 16 }}>📦</div>
                  <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 24 }}>No orders yet</p>
                  <button
                    onClick={() => router.push('/')}
                    style={{ padding: '12px 24px', backgroundColor: COLORS.DARK_BLUE, color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
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
                        style={{ padding: 24, backgroundColor: '#f9fafb', borderRadius: 12, transition: 'all 0.2s', border: '1px solid transparent' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => router.push(`/account/orders/${order.id}`)}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 8 }}>
                              Order #{order.orderNumber || order.id.slice(-8)}
                            </h3>
                            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                              {new Date(order.createdAt).toLocaleDateString('en-GB')}
                            </p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 16, fontSize: 12, fontWeight: 500, backgroundColor: status.color, color: COLORS.DARK_BLUE }}>
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

                          
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {safeOrders.length > 3 && (
                    <button
                      onClick={() => onTabChange?.('orders')}
                      style={{ padding: 16, backgroundColor: '#ffffff', color: COLORS.DARK_BLUE, border: `1px solid ${COLORS.BABY_BLUE}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.BABY_BLUE)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      View all {safeOrders.length} orders →
                    </button>
                  )}
                </div>
              )}
              {ordersError && !ordersLoading && (
                <p style={{ color: '#ef4444', marginTop: 12 }}>{ordersError}</p>
              )}
            </div>

            {/* Saved Products */}
            {Array.isArray(savedProducts) && savedProducts.length > 0 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.DARK_BLUE, marginBottom: 24 }}>Saved Products</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savedProducts.map((product) => {
                    const isAdding = reordering[`saved-${product.id}`];
                    const priceText = getPriceByCustomer(product.prices, customer);
                    return (
                      <div
                        key={product.id}
                        style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s', border: '1px solid transparent' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div style={{ width: 60, height: 60, backgroundColor: '#ffffff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {product.image ? (
                            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
                          ) : (
                            <div style={{ color: '#9ca3af', fontSize: 24 }}>📦</div>
                          )}
                        </div>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/product/${product.id}`)}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 4 }}>{product.name}</h4>
                          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>SKU: {product.sku || 'N/A'}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.DARK_BLUE }}>{priceText}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddSavedToCart(product); }}
                          disabled={isAdding}
                          style={{ padding: '8px 16px', backgroundColor: isAdding ? '#9ca3af' : COLORS.DARK_BLUE, color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: isAdding ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                        >
                          {isAdding ? (
                            <>
                              <div style={{ width: 12, height: 12, border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
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
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: COLORS.BABY_BLUE, color: '#0d2340' }}>
                  {customerBenefits.tier}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {customerBenefits.topBenefits.map((b, i) => (
                  <div key={i} style={{ padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.BABY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {b.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.DARK_BLUE, marginBottom: 2 }}>{b.title}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{b.description}</p>
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
                  style={{ width: '100%', padding: '16px 20px', backgroundColor: COLORS.DARK_BLUE, color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Outfit', sans-serif" }}
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
                  onClick={() => onTabChange?.('orders')}
                  style={{ width: '100%', padding: '16px 20px', backgroundColor: '#ffffff', color: COLORS.DARK_BLUE, border: `1px solid ${COLORS.BABY_BLUE}`, borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Outfit', sans-serif" }}
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
              <a href="mailto:support@example.com" style={{ fontSize: 13, color: COLORS.DARK_BLUE, textDecoration: 'none', fontWeight: 600 }}>
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
