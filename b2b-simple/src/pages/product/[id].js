import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/navbar';
import { useCart } from '../contexts/CartContext';
import { COLORS } from '../account';

/* -----------------------------
   Small gallery (inline)
------------------------------ */
function ProductImagesGallery({ images = [], selectedVariant }) {
  const [mainIndex, setMainIndex] = useState(0);
  const displayImages =
    selectedVariant?.images?.length ? selectedVariant.images : images;

  useEffect(() => {
    setMainIndex(0);
  }, [selectedVariant?.id]);

  if (!displayImages || displayImages.length === 0) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5', borderRadius: 8, height: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af'
      }}>
        No images available
      </div>
    );
  }

  return (
    <div>
      <div style={{
        position: 'relative', backgroundColor: '#f5f5f5', borderRadius: 8,
        overflow: 'hidden', marginBottom: 16, height: 400, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <img
          src={displayImages[mainIndex].url}
          alt={displayImages[mainIndex].label || 'Product image'}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setMainIndex((mainIndex - 1 + displayImages.length) % displayImages.length)}
              style={navBtnStyle('left')}
            >‹</button>
            <button
              onClick={() => setMainIndex((mainIndex + 1) % displayImages.length)}
              style={navBtnStyle('right')}
            >›</button>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', overflowX: 'auto', padding: 4 }}>
          {displayImages.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.label || `Thumb ${i + 1}`}
              onClick={() => setMainIndex(i)}
              style={{
                width: 60, height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer',
                border: i === mainIndex ? '2px solid #0d2340' : '2px solid #e5e7eb',
                opacity: i === mainIndex ? 1 : 0.7, transition: 'all .2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function navBtnStyle(side) {
  return {
    position: 'absolute', top: '50%', [side]: 16, transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', color: '#374151',
    width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };
}

/* -----------------------------
   Helpers for attributes
------------------------------ */
function shouldSkipAttribute(name, value) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value) && value.some(v => typeof v === 'object')) return true;
    if (!Array.isArray(value) && !value.label && !value.name && !value.key && !value.value) return true;
  }
  const skip = ['relatedproducts', 'relatedProducts', 'mobility', 'mobilityoptions'];
  return skip.includes(name.toLowerCase());
}
function formatAttributeLabel(name) {
  const map = {
    size: 'Size', color: 'Color', material: 'Material', capacity: 'Capacity',
    voltage: 'Voltage', power: 'Power Rating', model: 'Model', type: 'Type',
    diameter: 'Diameter', length: 'Length', pressure: 'Max Pressure',
    temperature: 'Operating Temperature', relatedProducts: 'Related Products',
    iso45001: 'ISO 45001 Certified'
  };
  return map[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
}
function formatAttributeValue(name, value) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      if (value.some(v => typeof v === 'object' && !v.label && !v.name && !v.key && !v.value)) return null;
      return value.map(v => (typeof v === 'object' ? (v.label || v.name || v.key || v.value || String(v)) : String(v))).join(', ');
    }
    if (value.label && typeof value.label === 'string') return value.label;
    if (value.name && typeof value.name === 'string') return value.name;
    if (value.key && typeof value.key === 'string') return value.key;
    if (value.value && typeof value.value !== 'object') return String(value.value);
    const keys = Object.keys(value);
    if (keys.length === 1 && typeof value[keys[0]] !== 'object') return String(value[keys[0]]);
    return null;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (name === 'voltage' && typeof value === 'number') return `${value}V`;
  if (name === 'power' && typeof value === 'number') return `${value}W`;
  if (name === 'capacity' && typeof value === 'number') return `${value}L`;
  if (name === 'pressure' && typeof value === 'number') return `${value} bar`;
  if (name === 'temperature' && typeof value === 'number') return `${value}°C`;
  return String(value);
}

/* -----------------------------
   Variant selector
------------------------------ */
function ProductVariantsSelector({ product, onVariantChange, customer }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  const allVariants = [product.masterVariant, ...(product.variants || [])];

  const attributeTypes = (() => {
    const map = {};
    allVariants.forEach(variant => {
      variant?.attributes?.forEach(attr => {
        if (shouldSkipAttribute(attr.name, attr.value)) return;
        if (!map[attr.name]) map[attr.name] = { name: attr.name, label: formatAttributeLabel(attr.name), values: new Set() };
        map[attr.name].values.add(attr.value);
      });
    });
    Object.keys(map).forEach(k => map[k].values = Array.from(map[k].values).sort());
    return map;
  })();

  function matchVariant(attrs) {
    return allVariants.find(v => {
      if (!v.attributes) return Object.keys(attrs).length === 0;
      return Object.entries(attrs).every(([n, val]) => {
        const found = v.attributes.find(a => a.name === n);
        if (!found) return false;
        if (typeof val === 'object' && typeof found.value === 'object') return JSON.stringify(val) === JSON.stringify(found.value);
        return found.value === val;
      });
    });
  }

  function handleAttributeChange(name, value) {
    const next = { ...selectedAttributes, [name]: value };
    setSelectedAttributes(next);
    const mv = matchVariant(next);
    if (mv) {
      setSelectedVariant(mv);
      onVariantChange(mv);
    }
  }

  useEffect(() => {
    if (!selectedVariant && product.masterVariant) {
      setSelectedVariant(product.masterVariant);
      onVariantChange(product.masterVariant);
      const init = {};
      product.masterVariant.attributes?.forEach(attr => {
        if (!shouldSkipAttribute(attr.name, attr.value)) {
          const val = formatAttributeValue(attr.name, attr.value);
          if (val !== null) init[attr.name] = attr.value;
        }
      });
      setSelectedAttributes(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const stockInfo = (() => {
    if (!selectedVariant?.availability) return { color: '#6b7280', message: 'Stock status unknown' };
    const { isOnStock, availableQuantity = 0 } = selectedVariant.availability;
    if (isOnStock && availableQuantity > 10) return { color: '#10b981', message: 'In Stock' };
    if (isOnStock && availableQuantity > 0) return { color: '#f59e0b', message: `Limited Stock (${availableQuantity})` };
    return { color: '#ef4444', message: 'Out of Stock' };
  })();

  const priceStr = (() => {
    if (!selectedVariant?.prices?.length) return 'Contact for price';
    const groupId = customer?.customerGroup?.id;
    // Prefer the customer's group price
    const groupPrice = groupId ? selectedVariant.prices.find(p => p.customerGroup?.id === groupId) : null;
    const p = groupPrice || selectedVariant.prices.find(pr => !pr.customerGroup) || selectedVariant.prices[0];
    if (!p) return 'Contact for price';
    const v = p.discounted?.value || p.value;
    return `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`;
  })();

  if (Object.keys(attributeTypes).length === 0) return null;

  return (
    <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#fafbfc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d2340" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
        </svg>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0d2340', margin: 0 }}>Product Options</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {Object.entries(attributeTypes).map(([name, info]) => (
          <div key={name}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              {info.label}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {info.values.map((val) => {
                const isSelected = selectedAttributes[name] === val;
                const display = formatAttributeValue(name, val);
                if (display === null) return null;
                return (
                  <button
                    key={JSON.stringify(val)}
                    onClick={() => handleAttributeChange(name, val)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#0d2340' : '#fff',
                      color: isSelected ? '#fff' : '#374151',
                      border: `1px solid ${isSelected ? '#0d2340' : '#d1d5db'}`,
                      borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      transition: 'all .15s', fontFamily: "'Outfit', sans-serif"
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#0d2340';
                        e.currentTarget.style.backgroundColor = '#f8fafe';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedVariant && (
        <div style={{ padding: 14, backgroundColor: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0d2340' }}>{priceStr}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stockInfo.color }} />
                  <span style={{ fontSize: 11, color: stockInfo.color, fontWeight: 500 }}>{stockInfo.message}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>SKU: {selectedVariant.sku || 'N/A'}</span>
                {selectedVariant.attributes?.length > 0 && (
                  <>
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {selectedVariant.attributes
                        .filter(a => !shouldSkipAttribute(a.name, a.value))
                        .map(a => {
                          const v = formatAttributeValue(a.name, a.value);
                          if (!v || v === 'null' || v === '[object Object]') return null;
                          return `${formatAttributeLabel(a.name)}: ${v}`;
                        })
                        .filter(Boolean)
                        .join(', ')
                      }
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -----------------------------
   Main Page
------------------------------ */
function groupIdToName(id) {
  const map = {
    '48627f63-30a3-47d8-8d3d-4b1c30787a8a': 'ASM',
    'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': 'Contract',
    '5db880e5-3e15-4cc0-9cd1-2b214dd53f23': 'Catalogue',
  };
  return map[id] || 'Member';
}

// New computeAppliedPrice from homepage

function computeAppliedPrice(prices = [], customer) {
  if (!prices.length) return { value: null, groupName: null };

  // Use effectiveGroupId if customerGroup is null
  const groupId = customer?.customerGroup?.id || customer?.effectiveGroupId;
  const findPrice = (filterFn) => prices.find(filterFn);

  let selectedPrice =
    (groupId && findPrice((p) => p.customerGroup?.id === groupId)) ||
    findPrice((p) => !p.customerGroup) ||
    prices[0];

  if (!selectedPrice) return { value: null, groupName: null };

  const value = selectedPrice.discounted?.value || selectedPrice.value;
  const groupName = groupId
    ? groupIdToName(groupId)
    : 'Catalogue';

  return { value, groupName };
}

export default function ProductDetail({ product, error }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { addToCart, loading } = useCart();

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) setCustomer(JSON.parse(stored));
    if (product) {
      const saved = JSON.parse(localStorage.getItem('savedProducts') || '[]');
      setIsSaved(Array.isArray(saved) && saved.some(p => p.id === product.id));
    }
  }, [product?.id]);

useEffect(() => {
  let userId = customer?.id;
  if (!userId) {
    userId = localStorage.getItem('guestId');
    if (!userId) {
      userId = `guest_${crypto.randomUUID()}`;
      localStorage.setItem('guestId', userId);
    }
  }
  const storageKey = `savedProducts_${userId}`;
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  setIsSaved(saved.some(p => p.id === product.id));
}, [customer, product?.id]);


  function getMainStockStatus(variant) {
    if (!variant?.availability) return { status: 'unknown', message: 'Stock status unknown', color: '#6b7280', quantity: null };
    const { isOnStock, availableQuantity = 0 } = variant.availability;
    if (isOnStock && availableQuantity > 10) return { status: 'in-stock', message: 'In Stock', color: '#10b981', quantity: availableQuantity };
    if (isOnStock && availableQuantity > 0) return { status: 'limited', message: 'Limited Stock', color: '#f59e0b', quantity: availableQuantity };
    return { status: 'out-of-stock', message: 'Out of Stock', color: '#ef4444', quantity: 0 };
  }
function handleSaveProduct() {
  setSavingProduct(true);
  try {
    // Get unique key for logged-in or guest user
    let userId = customer?.id;
    if (!userId) {
      userId = localStorage.getItem('guestId');
      if (!userId) {
        userId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem('guestId', userId);
      }
    }
    const storageKey = `savedProducts_${userId}`;

    // Load existing saved list
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const arr = Array.isArray(saved) ? saved : [];

    if (isSaved) {
      // Remove from saved list
      const next = arr.filter(p => p.id !== product.id);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setIsSaved(false);
    } else {
      const variant = selectedVariant || product.masterVariant;
      const toSave = {
        id: product.id,
        name: product.name,
        sku: variant?.sku || product.sku,
        image: product.image,
        prices: variant?.prices || product.prices || [],
        savedAt: new Date().toISOString()
      };

      // ✅ Prevent duplicate saves
      if (!arr.some(p => p.id === product.id)) {
        arr.push(toSave);
      }

      localStorage.setItem(storageKey, JSON.stringify(arr));
      setIsSaved(true);
    }
  } catch (e) {
    console.error('Error saving product', e);
  } finally {
    setSavingProduct(false);
  }
}



async function handleAddToCart() {
  try {
    setAddingToCart(true);

    // ✅ Always use SKU instead of ID
    const sku =
      selectedVariant?.sku ||
      product?.masterVariant?.sku ||
      null;

await addToCart(product.id, sku, quantity, product);


    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  } catch (e) {
    console.error('Add to cart failed', e);
    alert(e.message || 'Failed to add item to cart. Please try again.');
  } finally {
    setAddingToCart(false);
  }
}


  useEffect(() => {
  if (customer?.customerGroup?.id) {
    console.log('Customer group ID on detail page:', customer.customerGroup.id);
  }
}, [customer]);

   function getPrice(variant) {
    const v = variant || selectedVariant || product.masterVariant;
    const { value } = computeAppliedPrice(v?.prices || [], customer);
    if (!value) return 'Contact for price';
    return `${value.currencyCode} ${(value.centAmount / 100).toFixed(2)}`;
  }

const applied = product
  ? computeAppliedPrice(
      (selectedVariant?.prices || product.masterVariant?.prices || []),
      customer
    )
  : { value: null, groupName: null };
  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '80px auto', padding: 40, textAlign: 'center' }}>
          <h1>Error Loading Product</h1>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            style={primaryBtn}
          >
            Back to Home
          </button>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '80px auto', padding: 40, textAlign: 'center' }}>
          <h1>Product Not Found</h1>
          <button onClick={() => router.push('/')} style={primaryBtn}>Back to Home</button>
        </div>
      </>
    );
  }

  const currentVariant = selectedVariant || product.masterVariant;
  const stock = getMainStockStatus(currentVariant);

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', fontFamily: "'Outfit', sans-serif", padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', marginBottom: 32 }}>
          <button
            onClick={() => router.push('/')}
            style={linkBtn}
            onMouseEnter={e => e.currentTarget.style.color = '#0d2340'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >
            ← Back to Products
          </button>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', marginBottom: 48 }}>
            {/* Images */}
            <ProductImagesGallery
              images={product.masterVariant?.images || (product.image ? [{ url: product.image }] : [])}
              selectedVariant={selectedVariant}
            />

            {/* Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0d2340', margin: 0, flex: 1 }}>{product.name}</h1>

                {/* Save button — BABY BLUE */}
                <button
                  onClick={handleSaveProduct}
                  disabled={savingProduct}
                  style={{
                    background: isSaved ? COLORS.BABY_BLUE : 'transparent',
                    border: `1.5px solid ${COLORS.BABY_BLUE}`,
                    color: '#0d2340',
                    cursor: savingProduct ? 'not-allowed' : 'pointer',
                    padding: 8, marginLeft: 16, borderRadius: 8, transition: 'all .2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44
                  }}
                  onMouseEnter={e => { if (!savingProduct && !isSaved) e.currentTarget.style.backgroundColor = COLORS.BABY_BLUE; }}
                  onMouseLeave={e => { if (!savingProduct && !isSaved) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title={isSaved ? 'Saved' : 'Save'}
                >
                  {savingProduct ? (
                    <div style={spinnerSm} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24"
                         fill={isSaved ? '#0d2340' : 'none'}
                         stroke="#0d2340" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                )}
                </button>
              </div>

              {/* SKU + Stock */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
                  SKU: {currentVariant?.sku || 'N/A'}
                  {selectedVariant && selectedVariant !== product.masterVariant && (
                    <span style={{ marginLeft: 8, color: '#0d2340', fontWeight: 600, fontSize: 12 }}>
                      (Selected Variant)
                    </span>
                  )}
                </p>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  backgroundColor: stock.status === 'in-stock' ? '#f0fdf4' : stock.status === 'limited' ? '#fffbeb' : '#fef2f2',
                  borderRadius: 6,
                  border: `1px solid ${stock.status === 'in-stock' ? '#bbf7d0' : stock.status === 'limited' ? '#fed7aa' : '#fecaca'}`,
                  maxWidth: 'fit-content'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stock.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: stock.color }}>{stock.message}</span>
                  {stock.status === 'limited' && stock.quantity && (
                    <span style={{
                      fontSize: 12, color: '#92400e', backgroundColor: '#fbbf24',
                      padding: '2px 6px', borderRadius: 4, fontWeight: 600
                    }}>
                      {stock.quantity} left
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 12 }}>Description</h3>
                  <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>{product.description}</p>
                </div>
              )}

              {/* Price + group label */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: '#0d2340', marginBottom: 8 }}>
                  {getPrice(currentVariant)}
                </p>
          {customer && applied.groupName && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: COLORS.DARK_BLUE,
      fontSize: 14,
      fontWeight: 500
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    {applied.groupName} pricing applied
  </div>
)}

              </div>

              {/* Quantity + Actions */}
              {stock.status !== 'out-of-stock' && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Quantity {stock.status === 'limited' && (
                      <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>
                        (Max: {stock.quantity})
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={qtyBtn}>−</button>
                    <span style={{ fontSize: 16, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stock.quantity || 999, quantity + 1))}
                      style={qtyBtn}
                    >+</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || loading || stock.status === 'out-of-stock'}
                    style={{
                      flex: 1, padding: 16,
                      backgroundColor: addedToCart ? COLORS.BABY_BLUE : (addingToCart || loading || stock.status === 'out-of-stock' ? '#9ca3af' : '#0d2340'),
                      color: addedToCart ? '#0d2340' : '#ffffff',
                      border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: (addingToCart || loading || stock.status === 'out-of-stock') ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Outfit', sans-serif",
                      opacity: stock.status === 'out-of-stock' ? 0.6 : 1
                    }}
                  >
                  {addingToCart || loading ? (
                    <>
                      <div style={spinnerMd} />
                      Adding...
                    </>
                  ) : addedToCart ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Added
                    </>
                  ) : stock.status === 'out-of-stock' ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      Out of Stock
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>

                {/* Save (also here for convenience) */}
                <button
                  onClick={handleSaveProduct}
                  disabled={savingProduct}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: isSaved ? COLORS.BABY_BLUE : '#ffffff',
                    color: '#0d2340',
                    border: `1.5px solid ${COLORS.BABY_BLUE}`,
                    borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: savingProduct ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', minWidth: 120
                  }}
                >
                  {savingProduct ? (
                    <>
                      <div style={spinnerSm} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24"
                           fill={isSaved ? '#0d2340' : 'none'}
                           stroke="#0d2340" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {isSaved ? 'Saved' : 'Save'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Variants */}
          <ProductVariantsSelector
            product={product}
            onVariantChange={setSelectedVariant}
            customer={customer}
          />
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

const primaryBtn = {
  padding: '10px 24px', backgroundColor: '#0d2340', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
};
const linkBtn = {
  color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer',
  padding: 0, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif"
};
const qtyBtn = {
  width: 36, height: 36, border: '1px solid #e5e7eb', borderRadius: 4,
  backgroundColor: '#fff', cursor: 'pointer', fontSize: 20, color: '#6b7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const spinnerSm = {
  width: 16, height: 16, border: '2px solid #e5e7eb', borderTop: '2px solid #0d2340',
  borderRadius: '50%', animation: 'spin 1s linear infinite'
};
const spinnerMd = {
  width: 20, height: 20, border: '2px solid #ffffff', borderTop: '2px solid transparent',
  borderRadius: '50%', animation: 'spin 1s linear infinite'
};

/* -----------------------------
   Server-side data
   NOTE: We intentionally DO NOT add priceSelection params,
   so we get the full prices array (matches homepage behavior).
   We try by /{id}; if not found, we search by slug.
------------------------------ */
export async function getServerSideProps({ params }) {
  const { id } = params;

  // 1) OAuth token (same style you used elsewhere)
  const authRes = await fetch('https://auth.eu-central-1.aws.commercetools.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        '8q8D4Dt0axzQOQeM40fwHaGh:uNppWOlnTLBkqyFEx8L7chHgtSAFu43y'
      ).toString('base64')}` },
    body: 'grant_type=client_credentials'
  });

  if (!authRes.ok) {
    return { props: { product: null, error: `Authentication failed: ${authRes.status}` } };
  }
  const { access_token } = await authRes.json();

  // Helper: normalize projection into our shape
  const normalize = async (p) => {
    // optional inventory lookup (kept minimal; if you want you can remove this block)
    async function inv(sku) {
      if (!sku) return null;
      try {
        const r = await fetch(
          `https://api.eu-central-1.aws.commercetools.com/chempilot/inventory?where=sku%3D%22${encodeURIComponent(sku)}%22`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        if (!r.ok) return null;
        const data = await r.json();
        const i = data.results?.[0];
        if (i) return {
          isOnStock: (i.quantityOnStock || 0) > 0,
          availableQuantity: i.quantityOnStock,
          reservedQuantity: i.reservedQuantity || 0
        };
      } catch {}
      return null;
    }

    const masterAvail = await inv(p.masterVariant?.sku);
    const variants = Array.isArray(p.variants) ? p.variants : [];

    const variantWithAvail = await Promise.all(variants.map(async v => ({
      ...v,
      availability: await inv(v.sku),
      attributes: (v.attributes || []).map(a => ({ ...a, name: String(a.name), value: a.value }))
    })));

    return {
      id: p.id,
      name: p.name['en-GB'] || p.name['en'] || p.name['en-US'] || Object.values(p.name || {})[0] || 'Unnamed product',
      description:
        p.description?.['en-GB'] ||
        p.description?.['en'] ||
        p.description?.['en-US'] ||
        (typeof p.description === 'object' ? Object.values(p.description || {})[0] : p.description) ||
        null,
      image: p.masterVariant?.images?.[0]?.url || null,
      prices: p.masterVariant?.prices || [],
      sku: p.masterVariant?.sku || p.key || null,
      masterVariant: {
        ...p.masterVariant,
        availability: masterAvail,
        attributes: (p.masterVariant?.attributes || []).map(a => ({ ...a, name: String(a.name), value: a.value }))
      },
      variants: variantWithAvail,
      downloads: p.custom?.fields?.downloads || []
    };
  };

  // 2) Try direct by ID first
  const byId = await fetch(
    `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/${encodeURIComponent(id)}?staged=false`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (byId.ok) {
    const proj = await byId.json();
    const product = await normalize(proj);
    return { props: { product } };
  }

  // 3) Fall back to slug search (en-GB first, then en)
  const locales = ['en-GB', 'en'];
  for (const loc of locales) {
    const search = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections/search?staged=false&filter=slug.${encodeURIComponent(loc)}%3A%22${encodeURIComponent(id)}%22&limit=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (search.ok) {
      const data = await search.json();
      const hit = data.results?.[0];
      if (hit) {
        const product = await normalize(hit);
        return { props: { product } };
      }
    }
  }

  // Not found
  return { props: { product: null, error: 'Product not found' } };
}
