// src/pages/product/[id].jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/navbar';
import { useCart } from '../contexts/CartContext';
import { getCTToken } from '../../../lib/ctAuth.js';
import { API } from '../../../lib/ct-rest.js';

const COLORS = { DARK_BLUE: '#0d2340', BABY_BLUE: '#d7e9f7' };
const PRICE_CURRENCY = process.env.NEXT_PUBLIC_CT_PRICE_CURRENCY || 'GBP';
const PRICE_COUNTRY  = process.env.NEXT_PUBLIC_CT_PRICE_COUNTRY  || 'GB';

const groupMap = {
  'd7a14b96-ca48-4a3f-b35d-6bce624e3b16': { key: 'standard', label: 'Standard' },
  'fc05910d-ec00-4d7a-abaa-967d352af9fc': { key: 'testoverlap', label: 'Test Overlap' },
  '68baca5b-b96b-4751-9f85-215fb1a7417c': { key: 'special', label: 'Special Project' },
  'a1aff334-3def-4937-9116-5f2f96f93214': { key: 'distributor', label: 'Distributor' },
  '20304c81-f448-4c7e-9231-ba55488251e5': { key: 'contractA', label: 'Contract A' },
};

/* -----------------------------
   Helpers
------------------------------ */
function priceSelectionQS(groupId) {
  const params = new URLSearchParams();
  if (PRICE_CURRENCY) params.set('priceCurrency', PRICE_CURRENCY);
  if (PRICE_COUNTRY)  params.set('priceCountry', PRICE_COUNTRY);
  if (groupId)        params.set('priceCustomerGroup', groupId);
  params.set('staged', 'false');
  return `?${params.toString()}`;
}

function resolveCustomerGroup(customer) {
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
    if (groupMap[id]) return { id, ...groupMap[id] };
  }
  return null;
}

function computeAppliedPrice(prices = [], resolvedGroup) {
  if (!Array.isArray(prices) || prices.length === 0) return { value: null, groupName: null };
  const price =
    (resolvedGroup && prices.find(p => p.customerGroup?.id === resolvedGroup.id)) ||
    prices.find(p => !p.customerGroup) ||
    prices[0];
  if (!price) return { value: null, groupName: null };
  const value = price.discounted?.value || price.value;
  return { value, groupName: groupMap[resolvedGroup?.id]?.label || resolvedGroup?.label };
}

function localise(obj) {
  if (!obj) return '';
  return obj['en-GB'] || obj['en'] || Object.values(obj)[0] || '';
}

/* -----------------------------
   UI Components from your original code
------------------------------ */

// Image gallery
function ProductImagesGallery({ images = [], selectedVariant }) {
  const [mainIndex, setMainIndex] = useState(0);
  const displayImages =
    selectedVariant?.images?.length ? selectedVariant.images : images;

  useEffect(() => { setMainIndex(0); }, [selectedVariant?.id]);

  if (!displayImages || displayImages.length === 0) {
    return <div style={{ height: 400, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No images</div>;
  }

  return (
    <div>
      <div style={{ position: 'relative', background: '#f5f5f5', borderRadius: 8, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <img src={displayImages[mainIndex].url} alt={displayImages[mainIndex].label || 'Product'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        {displayImages.length > 1 && (
          <>
            <button onClick={() => setMainIndex((mainIndex - 1 + displayImages.length) % displayImages.length)} style={{ position: 'absolute', left: 10, top: '50%' }}>‹</button>
            <button onClick={() => setMainIndex((mainIndex + 1) % displayImages.length)} style={{ position: 'absolute', right: 10, top: '50%' }}>›</button>
          </>
        )}
      </div>
    </div>
  );
}

/* -----------------------------
   Main PDP Component
------------------------------ */
export default function ProductDetail({ initialProduct, error }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(initialProduct);
  const [customer, setCustomer] = useState(null);
  const [resolvedGroup, setResolvedGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('customer');
    if (stored) {
      const parsed = JSON.parse(stored);
      setCustomer(parsed);
      setResolvedGroup(resolveCustomerGroup(parsed));
    }
  }, [product?.id]);

  // Re-fetch fresh pricing when group changes
  useEffect(() => {
    if (!product?.id || !resolvedGroup) return;
    const qs = priceSelectionQS(resolvedGroup.id);
    fetch(`/api/products/${product.id}${qs}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(setProduct)
      .catch(console.error);
  }, [resolvedGroup?.id]);

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Error Loading Product</h1>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button onClick={() => router.push('/')}>Back to Home</button>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h1>Product Not Found</h1>
          <button onClick={() => router.push('/')}>Back to Home</button>
        </div>
      </>
    );
  }

  const mv = product.masterVariant;
  const applied = computeAppliedPrice(mv?.prices || [], resolvedGroup);

  const showPrices = !!customer;
  const priceText = applied.value
    ? `${applied.value.currencyCode} ${(applied.value.centAmount / 100).toFixed(2)}`
    : 'Contact for price';

  async function handleAddToCart() {
    try {
      await addToCart(product.id, mv?.sku, quantity, product);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (e) {
      console.error('Add to cart failed', e);
      alert('Failed to add item to cart.');
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <ProductImagesGallery images={mv?.images || (product.image ? [{ url: product.image }] : [])} />

        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{localise(product.name)}</h1>
          <p style={{ color: '#6b7280' }}>SKU: {mv?.sku}</p>

          <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.DARK_BLUE, marginTop: 16 }}>
            {showPrices ? priceText : 'Login to view price'}
          </p>

          {applied.groupName && showPrices && (
            <p style={{ fontSize: 14, color: COLORS.BABY_BLUE }}>{applied.groupName} pricing applied</p>
          )}

          {product.description && (
            <div style={{ marginTop: 24 }}>
              <h3>Description</h3>
              <p>{localise(product.description)}</p>
            </div>
          )}

          {showPrices && (
            <div style={{ marginTop: 32 }}>
              <label>Quantity</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button onClick={handleAddToCart} style={{ background: COLORS.DARK_BLUE, color: '#fff', padding: '12px 20px', borderRadius: 8 }}>
                {addedToCart ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* -----------------------------
   SSR
------------------------------ */
export async function getServerSideProps(ctx) {
  const { id } = ctx.params;
  try {
    const { access_token } = await getCTToken();
    const groupId = ctx.req.cookies?.customerGroupId || '';
    const qs = priceSelectionQS(groupId);

    const res = await fetch(
      API(`/product-projections/${encodeURIComponent(id)}${qs}`),
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      return { props: { initialProduct: null, error: text || 'Failed to fetch product' } };
    }

    const product = await res.json();
    return { props: { initialProduct: product } };
  } catch (e) {
    return { props: { initialProduct: null, error: e.message || 'Unexpected error' } };
  }
}
