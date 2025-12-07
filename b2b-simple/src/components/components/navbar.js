import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/src/pages/contexts/CartContext";

export default function Navbar({ onToggleFilters, hideBenefitsBar = false }) {
  const [customer, setCustomer] = useState(null);
  const { cart, itemCount, setCartCustomer } = useCart();

  useEffect(() => {
    function syncCustomer() {
      try {
        const stored = localStorage.getItem("customer");
        if (stored) {
          const customerData = JSON.parse(stored);
          setCustomer(customerData);

          // ✅ Prevent loop: only update if cart exists and has a different customerId
          if (cart && cart.customerId !== customerData.id) {
            setCartCustomer(
              cart.id,
              customerData.id,
              customerData.customerGroup?.id ||
                customerData.effectiveGroupId ||
                (Array.isArray(customerData.customerGroupAssignments)
                  ? customerData.customerGroupAssignments[0]?.id
                  : null)
            );
          }
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      }
    }

    // Run immediately
    syncCustomer();

    // Also watch for localStorage updates
    window.addEventListener("storage", syncCustomer);
    return () => window.removeEventListener("storage", syncCustomer);
  }, [cart, setCartCustomer]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    setCustomer(null);
    // No need to call setCartCustomer(null) here, just clear state
    window.location.href = "/";
  };

  // ✅ Hardcoded group IDs from your list
  const groupMap = {
    "d7a14b96-ca48-4a3f-b35d-6bce624e3b16": { key: "standard", label: "Standard" },
    "fc05910d-ec00-4d7a-abaa-967d352af9fc": { key: "testoverlap", label: "Test Overlap" },
    "68baca5b-b96b-4751-9f85-215fb1a7417c": { key: "special", label: "Special Project" },
    "a1aff334-3def-4937-9116-5f2f96f93214": { key: "distributor", label: "Distributor" },
    "20304c81-f448-4c7e-9231-ba55488251e5": { key: "contractA", label: "Contract A" },
  };

  const getCustomerGroup = () => {
    if (!customer) return null;
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
    return null;
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
              color: '#0a0a0a',
              textDecoration: 'none',
              letterSpacing: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            MACH MODEL B2B (Packaging Demo)
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
                color: '#0a0a0a',
                cursor: 'pointer',
                transition: 'all 0.2s',
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
              textDecoration: 'none',
              color: '#0a0a0a',
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
                backgroundColor: '#0a0a0a',
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
                    color: '#0a0a0a',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  {customer.firstName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#0a0a0a' }}>
                    {customer.firstName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {customerGroup?.label || 'Member'}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  border: '1.5px solid #d7e9f7',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 500,
                  fontSize: '14px',
                  color: '#0a0a0a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
              <Link href="/signup" style={{ padding: '10px 20px', backgroundColor: '#0a0a0a', color: '#fff', borderRadius: '8px' }}>
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
              <span style={{ fontSize: '13px', color: '#0a0a0a', fontWeight: '500' }}>
                🎯 {customerGroup.label} Pricing Active
              </span>
              <span style={{ fontSize: '13px', color: '#0a0a0a' }}>
                • {customerGroup.key === 'contractA' ? 'Contract pricing applied' : 'Standard pricing'}
              </span>
              <span style={{ fontSize: '13px', color: '#0a0a0a' }}>• Free Shipping on Orders Over £500</span>
            </div>
            <Link href="/account" style={{ fontSize: '13px', color: '#0a0a0a', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
