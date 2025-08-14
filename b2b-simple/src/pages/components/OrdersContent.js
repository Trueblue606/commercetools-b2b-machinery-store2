// components/OrdersContent.jsx
import { useRouter } from 'next/router';
import { COLORS } from '../account';

export default function OrdersContent({ customer, orders = [] }) {
  const router = useRouter();

  const safeOrders = Array.isArray(orders) ? orders : [];

  const formatOrderStatus = (orderState) => {
    const statusMap = {
      'Open': { label: 'Processing', color: COLORS.BABY_BLUE, emoji: '⏳' },
      'Complete': { label: 'Delivered', color: '#10b981', emoji: '✅' },
      'Confirmed': { label: 'Confirmed', color: '#3b82f6', emoji: '📋' },
      'Cancelled': { label: 'Cancelled', color: COLORS.SECONDARY, emoji: '❌' }
    };
    return statusMap[orderState] || { label: orderState, color: '#6b7280', emoji: '📦' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.DARK_BLUE, marginBottom: '24px' }}>Your Orders</h1>

      {safeOrders.length === 0 ? (
        <p style={{ color: '#4B5563' }}>You have no orders yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {safeOrders.map(order => {
            const orderDate = new Date(order.createdAt);
            const total = (order.totalPrice?.centAmount || 0) / 100;
            const itemCount = order.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const status = formatOrderStatus(order.orderState);

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${COLORS.BABY_BLUE}`,
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(13, 35, 64, 0.05)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.3s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 35, 64, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(13, 35, 64, 0.05)'}
              >
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: COLORS.DARK_BLUE, marginBottom: '6px' }}>
                    Order #{order.orderNumber || order.id.slice(-8)}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                    {orderDate.toLocaleDateString('en-GB')}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>{itemCount} item(s)</p>
            
                  <p style={{ fontSize: '20px', fontWeight: '700', color: COLORS.DARK_BLUE, marginTop: '12px' }}>
                    £{total.toFixed(2)}
                  </p>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => router.push(`/account/orders/${order.id}`)}
                    style={{
                      fontSize: '14px',
                      backgroundColor: COLORS.BABY_BLUE,
                      color: COLORS.DARK_BLUE,
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontFamily: 'Outfit',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
