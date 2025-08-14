// components/AccountHeader.js
import { COLORS } from "../account";

const groupMap = {
  'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': { 
    name: 'Professional', 
    discount: 5,
    badge: '🏢'
  },
  '48627f63-30a3-47d8-8d3d-4b1c30787a8a': { 
    name: 'Enterprise', 
    discount: 15,
    badge: '🏭'
  }
};

export default function AccountHeader({ customer, customerDetails, onRefresh, onSignOut }) {
  const customerGroup = customer?.customerGroup?.id 
    ? groupMap[customer.customerGroup.id] 
    : { name: 'Standard', discount: 0, badge: '👤' };

  const displayCustomer = customerDetails || customer;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderBottom: `1px solid ${COLORS.BABY_BLUE}`,
      padding: '24px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '24px' }}>{customerGroup.badge}</span>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: COLORS.DARK_BLUE,
                marginBottom: '2px'
              }}>
                {displayCustomer.firstName} {displayCustomer.lastName}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {displayCustomer.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={onSignOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              color: '#6b7280',
              border: `1px solid ${COLORS.BABY_BLUE}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = COLORS.DARK_BLUE;
              e.currentTarget.style.color = COLORS.DARK_BLUE;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = COLORS.BABY_BLUE;
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}