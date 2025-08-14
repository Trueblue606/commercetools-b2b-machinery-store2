// pages/order-success.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from './components/navbar';

const DARK_BLUE = '#0d2340';
const BABY_BLUE = '#d7e9f7';

export default function OrderSuccess() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for order data in localStorage
    const checkOrderData = () => {
      const savedOrder = localStorage.getItem('lastOrder');
      console.log('Checking for order data:', savedOrder ? 'Found' : 'Not found');
      
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          console.log('Order data loaded:', parsedOrder);
          setOrderData(parsedOrder);
          // Clear the order data after loading
          localStorage.removeItem('lastOrder');
          localStorage.removeItem('selected_items');
        } catch (error) {
          console.error('Error parsing order data:', error);
        }
      }
      setLoading(false);
    };

    // Add a small delay to ensure localStorage is written
    const timer = setTimeout(checkOrderData, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{
          backgroundColor: '#fff',
          minHeight: 'calc(100vh - 68px)',
          fontFamily: "'Outfit', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              width: '50px',
              height: '50px',
              border: `5px solid ${BABY_BLUE}`,
              borderTop: `5px solid ${DARK_BLUE}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  if (!orderData) {
    return (
      <>
        <Navbar />
        <div style={{
          backgroundColor: '#fff',
          minHeight: 'calc(100vh - 68px)',
          fontFamily: "'Outfit', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 480,
            margin: '0 auto',
            padding: '48px 0'
          }}>
            <h2 style={{ color: DARK_BLUE, fontWeight: 700, fontSize: 26, marginBottom: 18 }}>
              No Order Found
            </h2>
            <p style={{ color: DARK_BLUE, marginBottom: 30 }}>
              Looks like you haven't placed an order yet.
            </p>
            <Link
              href="/"
              style={{
                background: DARK_BLUE,
                color: '#fff',
                padding: '12px 30px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'background 0.15s'
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Calculate price breakdown
  const grossTotal = orderData.totalPrice?.centAmount || 0;
  const netTotal = orderData.taxedPrice?.totalNet?.centAmount || Math.round(grossTotal / 1.2); // Calculate net if not provided
  const vatAmount = orderData.taxedPrice?.taxPortions?.[0]?.amount?.centAmount || (grossTotal - netTotal);
  const vatRate = orderData.taxedPrice?.taxPortions?.[0]?.rate || 0.2;

  return (
    <>
      <Navbar />
      <div style={{
        backgroundColor: '#fff',
        minHeight: 'calc(100vh - 68px)',
        fontFamily: "'Outfit', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          padding: '36px 0'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '86px',
            height: '86px',
            backgroundColor: BABY_BLUE,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={DARK_BLUE} strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: '800',
            color: DARK_BLUE,
            marginBottom: '8px'
          }}>
            Order Confirmed!
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: DARK_BLUE,
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Thank you for your order.<br />
            <span style={{
              color: DARK_BLUE,
              fontWeight: 600,
              fontSize: '1.04rem'
            }}>{orderData.customerEmail}</span>
          </p>

          {/* Order Details */}
          <div style={{
            textAlign: 'left',
            margin: '0 auto 28px',
            padding: '18px 0 0 0',
            borderTop: `1.5px solid ${BABY_BLUE}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: DARK_BLUE, fontWeight: 500 }}>Order #</span>
              <span style={{ fontWeight: '700', color: DARK_BLUE }}>{orderData.orderNumber}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{ color: DARK_BLUE, fontWeight: 500 }}>Order ID</span>
              <span style={{ fontWeight: '600', color: DARK_BLUE, fontSize: '14px' }}>
                {orderData.id.substring(0, 8)}...
              </span>
            </div>

            {/* Price Breakdown */}
            {orderData.taxedPrice && (
              <div style={{
                backgroundColor: '#f8fafe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '14px'
                }}>
                  <span style={{ color: DARK_BLUE }}>Subtotal (net)</span>
                  <span style={{ fontWeight: '600', color: DARK_BLUE }}>
                    {orderData.totalPrice.currencyCode} {(netTotal / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <span style={{ color: DARK_BLUE }}>
                    VAT ({(vatRate * 100).toFixed(0)}%)
                  </span>
                  <span style={{ fontWeight: '600', color: DARK_BLUE }}>
                    + {orderData.totalPrice.currencyCode} {(vatAmount / 100).toFixed(2)}
                  </span>
                </div>
                <div style={{
                  borderTop: `1px solid ${BABY_BLUE}`,
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: '700', color: DARK_BLUE }}>Total (gross)</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: DARK_BLUE }}>
                    {orderData.totalPrice.currencyCode} {(grossTotal / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* If no tax breakdown, just show total */}
            {!orderData.taxedPrice && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: DARK_BLUE }}>Total Paid</span>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: DARK_BLUE }}>
                  {orderData.totalPrice.currencyCode} {(grossTotal / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <ul style={{
            textAlign: 'left',
            color: DARK_BLUE,
            fontSize: '14.2px',
            lineHeight: '1.8',
            paddingLeft: '22px',
            margin: '0 0 32px 0',
            background: 'none'
          }}>
            <li>Order confirmation sent by email</li>
            <li>Processing in 1–2 business days</li>
            <li>Shipping/tracking email once dispatched</li>
            <li>Delivery in 3–5 business days</li>
          </ul>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: 2 }}>
            <Link
              href="/"
              style={{
                padding: '13px 28px',
                backgroundColor: DARK_BLUE,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '16px',
                transition: 'background 0.2s'
              }}
            >
              Continue Shopping
            </Link>
            <Link
              href="/account?tab=orders"
              style={{
                padding: '13px 28px',
                backgroundColor: 'transparent',
                color: DARK_BLUE,
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '16px',
                border: `2px solid ${BABY_BLUE}`,
                transition: 'all 0.18s'
              }}
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}