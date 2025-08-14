import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/pages/components/navbar';

function OrderImagesGallery({ orderItems }) {
  const [mainIndex, setMainIndex] = useState(0);

  // Extract images from order items - check for actual image URLs in your data structure
  const images = [];
  
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach(item => {
      // Check if item has images - adjust these paths based on your actual data structure
      if (item.images && item.images.length > 0) {
        item.images.forEach(img => {
          images.push({
            url: img.url,
            label: `${item.name} - ${img.label || 'Product Image'}`
          });
        });
      } else if (item.image) {
        // Single image field
        images.push({
          url: item.image,
          label: item.name
        });
      } else if (item.masterVariant?.images?.length > 0) {
        // CommerceTools structure
        item.masterVariant.images.forEach(img => {
          images.push({
            url: img.url,
            label: `${item.name} - ${img.label || 'Product Image'}`
          });
        });
      }
    });
  }

  // If no images found, use placeholders
  if (images.length === 0) {
    images.push({
      url: null, // Will show placeholder
      label: orderItems?.[0]?.name || 'Order Item'
    });
  }

  const prevImage = () => {
    setMainIndex((mainIndex - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setMainIndex((mainIndex + 1) % images.length);
  };

  return (
    <div>
      {/* Main Image */}
      <div style={{ 
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {images[mainIndex].url ? (
          <img
            src={images[mainIndex].url}
            alt={images[mainIndex].label}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
            }}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          fontSize: '64px',
          color: '#9ca3af',
          display: images[mainIndex].url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          📦
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: 'absolute',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                color: '#374151',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                color: '#374151',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          justifyContent: 'center',
          overflowX: 'auto',
          padding: '4px'
        }}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setMainIndex(i)}
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
                border: i === mainIndex ? '2px solid #0d2340' : '2px solid #e5e7eb',
                opacity: i === mainIndex ? 1 : 0.7,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{
                fontSize: '16px',
                color: '#9ca3af',
                display: img.url ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}>
                📦
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Hook defined inline to avoid external import
function useOrderDetails() {
  const [orderDetails, setOrderDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const getOrderDetails = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      const authRes = await fetch('/api/auth');
      const { token } = await authRes.json();

      const response = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      const order = await response.json();

      // Fetch product details for images
      const lineItemsWithImages = await Promise.all(
        order.lineItems?.map(async (item) => {
          let productImages = [];
          
          try {
            // Fetch product details to get images
            const productResponse = await fetch(
              `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/${item.productId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (productResponse.ok) {
              const productData = await productResponse.json();
              productImages = productData.masterVariant?.images || [];
            }
          } catch (err) {
            console.warn('Failed to fetch product images:', err);
          }

          return {
            id: item.id,
            productId: item.productId,
            name: item.name?.['en-GB'] || item.name?.['en'] || Object.values(item.name)[0],
            sku: item.variant?.sku || '',
            quantity: item.quantity,
            price: {
              centAmount: item.price.value.centAmount,
              currencyCode: item.price.value.currencyCode,
              formatted: `${item.price.value.currencyCode} ${(item.price.value.centAmount / 100).toFixed(2)}`,
            },
            images: productImages, // Add images to each line item
          };
        }) || []
      );

      const enhanced = {
        id: order.id,
        orderNumber: order.orderNumber,
        orderState: order.orderState,
        createdAt: order.createdAt,
        lastModifiedAt: order.lastModifiedAt,
        customerEmail: order.customerEmail,
        customerId: order.customerId,
        totalPrice: {
          centAmount: order.totalPrice?.centAmount || 0,
          currencyCode: order.totalPrice?.currencyCode || 'GBP',
          formatted: `${order.totalPrice?.currencyCode || 'GBP'} ${(order.totalPrice?.centAmount || 0) / 100}`,
        },
        lineItems: lineItemsWithImages,
        shippingAddress: order.shippingAddress
          ? {
              formatted: [
                `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                `${order.shippingAddress.streetNumber} ${order.shippingAddress.streetName}`,
                `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`,
                order.shippingAddress.country,
              ]
                .filter(Boolean)
                .join('\n'),
            }
          : null,
        billingAddress: order.billingAddress
          ? {
              formatted: [
                `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
                `${order.billingAddress.streetNumber} ${order.billingAddress.streetName}`,
                `${order.billingAddress.city}, ${order.billingAddress.postalCode}`,
                order.billingAddress.country,
              ]
                .filter(Boolean)
                .join('\n'),
            }
          : null,
        summary: {
          totalQuantity: order.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0,
          status: {
            label:
              order.orderState === 'Open'
                ? 'Processing'
                : order.orderState === 'Complete'
                ? 'Delivered'
                : order.orderState,
          },
        },
      };

      setOrderDetails(enhanced);
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  return {
    orderDetails,
    loading,
    error,
    getOrderDetails,
  };
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { orderDetails, loading, error, getOrderDetails } = useOrderDetails();

  useEffect(() => {
    if (id) getOrderDetails(id);
  }, [id]);

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ 
          maxWidth: '600px',
          margin: '80px auto',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1>Error Loading Order</h1>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#0d2340',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            Back to Home
          </button>
        </div>
      </>
    );
  }

  if (!orderDetails) {
    return (
      <>
        <Navbar />
        <div style={{ 
          maxWidth: '600px',
          margin: '80px auto',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1>Order Not Found</h1>
          <button 
            onClick={() => router.push('/')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#0d2340',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            Back to Home
          </button>
        </div>
      </>
    );
  }

  const {
    orderNumber,
    createdAt,
    summary,
    totalPrice,
    lineItems,
    shippingAddress,
    billingAddress,
  } = orderDetails;

  // Get the first item for main display
  const mainItem = lineItems[0];

  return (
    <>
      <Navbar />
      <div style={{
        backgroundColor: '#ffffff',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Outfit', sans-serif",
        padding: '32px 0'
      }}>
        {/* Breadcrumb */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Outfit', sans-serif",
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0d2340'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            ← Back to Orders
          </button>
        </div>

        {/* Order Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'start'
        }}>
          {/* Left Column - Images */}
          <div style={{ 
            position: 'sticky', 
            top: '20px',
            height: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            minHeight: '600px'
          }}>
            <OrderImagesGallery orderItems={lineItems} />
          </div>

          {/* Right Column - Order Info */}
          <div>
            {/* Order Title */}
            <h1 style={{ 
              fontSize: '32px',
              fontWeight: '700',
              color: '#0d2340',
              marginBottom: '12px'
            }}>
              Order #{orderNumber}
            </h1>

            {/* Order Date */}
            <p style={{ 
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '32px'
            }}>
              Placed on {new Date(createdAt).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

        
            {/* Price and Order Details */}
            <div style={{ marginBottom: '32px' }}>
              {/* Total Price */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#0d2340',
                  marginBottom: '8px'
                }}>
                  {totalPrice.formatted}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '0d2340',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Status: {summary.status.label}
                </div>
              </div>

              {/* Order Details */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Order Details
                </label>
                <div style={{ 
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Items: </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {summary.totalQuantity}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Order Status: </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {summary.status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* All Items List */}
              {lineItems.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Items in Order
                  </label>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {lineItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        style={{
                          paddingBottom: index < lineItems.length - 1 ? '12px' : '0',
                          marginBottom: index < lineItems.length - 1 ? '12px' : '0',
                          borderBottom: index < lineItems.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Qty: {item.quantity} • SKU: {item.sku}
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {item.price.formatted}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <button
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#0d2340',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif",
                  marginBottom: '12px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Track Order
              </button>

              <button
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                Download Invoice
              </button>
            </div>

            {/* Addresses */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              paddingTop: '32px',
              borderTop: '1px solid #e5e7eb'
            }}>
              {shippingAddress && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d2340" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Shipping</p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                    {shippingAddress.formatted}
                  </p>
                </div>
              )}
              
              {billingAddress && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d2340" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Billing</p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                    {billingAddress.formatted}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}