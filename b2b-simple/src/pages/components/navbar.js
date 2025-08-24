import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function Navbar({ onToggleFilters, hideBenefitsBar = false }) {
  const [customer, setCustomer] = useState(null);
  const { cart, itemCount, setCartCustomer } = useCart(); // ✅ added cart
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const stored = localStorage.getItem('customer');
    if (stored && cart) { // ✅ wait for cart
      const customerData = JSON.parse(stored);
      setCustomer(customerData);

      setCartCustomer(
        cart.id,
        customerData.id, // commercetools customerId
        customerData.customerGroup?.id ||
          customerData.effectiveGroupId ||
          (Array.isArray(customerData.customerGroupAssignments)
            ? customerData.customerGroupAssignments[0]?.id
            : null)
      );
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customer');
    setCustomer(null);
    if (cart) {
      setCartCustomer(cart.id, null, null); // reset
    }
    window.location.href = '/';
  };

  const groupMap = {
    'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': { key: 'contractpricing', label: 'Contract' },
    '48627f63-30a3-47d8-8d3d-4b1c30787a8a': { key: 'asm', label: 'ASM' },
    '5db880e5-3e15-4cc0-9cd1-2b214dd53f23': { key: 'catalogue', label: 'Catalogue' },
  };

  const getCustomerGroup = () => {
    if (!customer) return { key: 'catalogue', label: 'Catalogue' };

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
      if (groupMap[id]) return groupMap[id];
    }

    return { key: 'catalogue', label: 'Catalogue' };
  };

  const customerGroup = getCustomerGroup();

  return (
    <nav
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #d7e9f7',
        fontFamily: "'Outfit', sans-serif",
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(13, 35, 64, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px',
          height: '68px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          <Link
            href="/"
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#0d2340',
              textDecoration: 'none',
              letterSpacing: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Chempilot
          </Link>

          {onToggleFilters && (
            <button
              onClick={onToggleFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
                border: '1.5px solid #d7e9f7',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 500,
                fontSize: '14px',
                fontFamily: "'Outfit', sans-serif",
                color: '#0d2340',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d7e9f7';
                e.currentTarget.style.borderColor = '#0d2340';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#d7e9f7';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="8" y1="16" x2="20" y2="16" />
                <circle cx="6" cy="8" r="2" />
                <circle cx="14" cy="16" r="2" />
              </svg>
              Browse
            </button>
          )}
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Cart */}
          <Link
            href="/cart"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1.5px solid #d7e9f7',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textDecoration: 'none',
              color: '#0d2340',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d7e9f7';
              e.currentTarget.style.borderColor = '#0d2340';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d7e9f7';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: '#0d2340',
                color: '#ffffff',
                borderRadius: '50%',
                minWidth: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                border: '2px solid #ffffff',
              }}
            >
              {itemCount || 0}
            </span>
          </Link>

          {customer ? (
            <>
              {/* User Info */}
              <Link
                href="/account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#d7e9f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d2340',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  {customer.firstName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#0d2340' }}>
                    {customer.firstName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {customerGroup.label}
                  </div>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: '1.5px solid #d7e9f7',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 500,
                  fontSize: '14px',
                  fontFamily: "'Outfit', sans-serif",
                  color: '#0d2340',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ padding: '10px 20px', border: '1.5px solid #d7e9f7', borderRadius: '8px' }}>
                Login
              </Link>
              <Link href="/signup" style={{ padding: '10px 20px', backgroundColor: '#0d2340', color: '#fff', borderRadius: '8px' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {customer && customerGroup && !hideBenefitsBar && (
        <div style={{ backgroundColor: '#d7e9f7', padding: '10px 0', borderTop: '1px solid #bfd9f2' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '13px', color: '#0d2340', fontWeight: '500' }}>
                🎯 {customerGroup.label} Pricing Active
              </span>
              <span style={{ fontSize: '13px', color: '#0d2340' }}>
                • {customerGroup.key === 'contractpricing' ? 'Contract pricing applied' : 'Standard pricing'}
              </span>
              <span style={{ fontSize: '13px', color: '#0d2340' }}>• Free Shipping on Orders Over £500</span>
            </div>
            <Link href="/account" style={{ fontSize: '13px', color: '#0d2340', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Account Benefits
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
