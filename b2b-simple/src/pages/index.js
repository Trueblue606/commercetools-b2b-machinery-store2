// pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './components/navbar';
import FiltersSidebar from './components/FiltersSidebar';
import SearchBar from './components/SearchBar';

const PRICE_CURRENCY = process.env.NEXT_PUBLIC_CT_PRICE_CURRENCY || 'GBP';
const PRICE_COUNTRY = process.env.NEXT_PUBLIC_CT_PRICE_COUNTRY || 'GB';

// ----- shared group map (same as Navbar) -----
const groupMap = {
  'd7a14b96-ca48-4a3f-b35d-6bce624e3b16': { key: 'standard', label: 'Standard' },
  'fc05910d-ec00-4d7a-abaa-967d352af9fc': { key: 'testoverlap', label: 'Test Overlap' },
  '68baca5b-b96b-4751-9f85-215fb1a7417c': { key: 'special', label: 'Special Project' },
  'a1aff334-3def-4937-9116-5f2f96f93214': { key: 'distributor', label: 'Distributor' },
  '20304c81-f448-4c7e-9231-ba55488251e5': { key: 'contractA', label: 'Contract A' },
};

// build CT querystring
function priceSelectionQS(groupId) {
  const params = new URLSearchParams();
  if (PRICE_CURRENCY) params.set('priceCurrency', PRICE_CURRENCY);
  if (PRICE_COUNTRY) params.set('priceCountry', PRICE_COUNTRY);
  if (groupId) params.set('priceCustomerGroup', groupId);
  const s = params.toString();
  return s ? `&${s}` : '';
}

// resolve the "best" customer group (same as Navbar)
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

// compute applied price (uses resolved groupId)
function computeAppliedPrice(prices, resolvedGroup) {
  if (!Array.isArray(prices) || prices.length === 0)
    return { text: 'Contact for price', groupId: null };

  // first try resolvedGroup
  if (resolvedGroup) {
    const price = prices.find(p => p.customerGroup?.id === resolvedGroup.id);
    if (price) {
      const v = price.discounted?.value || price.value;
      return {
        text: `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`,
        groupId: resolvedGroup.id,
      };
    }
  }

  // fallback: base (no group)
  const base = prices.find(p => !p.customerGroup);
  if (base) {
    const v = base.discounted?.value || base.value;
    return { text: `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`, groupId: null };
  }

  return { text: '', groupId: null };
}

export default function Home({ initialProducts, initialCategories, authToken }) {
  const [products, setProducts] = useState(initialProducts);
  const [allProducts] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ type: null, id: null, name: null });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsCount, setSearchResultsCount] = useState(0);

  const [customer, setCustomer] = useState(null);
  const [resolvedGroup, setResolvedGroup] = useState(null);

  // load customer from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('customer');
      if (stored) {
        const c = JSON.parse(stored);
        setCustomer(c);
        setResolvedGroup(resolveCustomerGroup(c));
      }
    } catch {}
  }, []);

  // re-render on group change → refresh price labels
  useEffect(() => {
    if (resolvedGroup) setProducts(prev => [...prev]);
  }, [resolvedGroup]);

  // ---------------- search ----------------
  const handleSearch = async (query) => {
    setIsSearching(true);
    setSearchQuery(query);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=50${priceSelectionQS(resolvedGroup?.id)}`
      );
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
        setSearchResultsCount(data.total || 0);
        setActiveFilter({ type: 'search', id: null, name: `"${query}"` });
        setFilterSidebarOpen(false);
      } else {
        console.error('Search failed:', data.message);
        setProducts([]);
        setSearchResultsCount(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
      setSearchResultsCount(0);
    }

    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setProducts(allProducts);
    setSearchResultsCount(0);
    setActiveFilter({ type: null, id: null, name: null });
  };

  // ---------------- category ----------------
  const fetchProductsByCategory = async (categoryId) => {
    if (!categoryId) {
      setProducts(allProducts);
      setActiveFilter({ type: null, id: null, name: null });
      setSearchQuery('');
      setSearchResultsCount(0);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const res = await fetch(
        `/api/products-by-category?categoryId=${categoryId}${priceSelectionQS(resolvedGroup?.id)}`
      );
      const data = await res.json();
      setProducts(data.products || []);
      const categoryName = categories.find(c => c.id === categoryId)?.name || 'Unknown';
      setActiveFilter({ type: 'category', id: categoryId, name: categoryName });
      setFilterSidebarOpen(false);
      setSearchQuery('');
      setSearchResultsCount(0);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setProducts([]);
    }
    setIsLoadingProducts(false);
  };

  // ---------------- selection ----------------
  const fetchProductsBySelection = async (selectionId) => {
    if (!selectionId) {
      setProducts(allProducts);
      setActiveFilter({ type: null, id: null, name: null });
      setSearchQuery('');
      setSearchResultsCount(0);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const productsRes = await fetch(`/api/product-by-selection?selectionId=${encodeURIComponent(selectionId)}`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productIds = productsData.results.map(p => p.product.id);

        if (productIds.length > 0) {
          const whereClause = productIds.map(id => `"${id}"`).join(',');
          const url = `/api/products-by-category?where=${encodeURIComponent(`id in (${whereClause})`)}${priceSelectionQS(resolvedGroup?.id)}`;
          const projectionsRes = await fetch(url);

          if (projectionsRes.ok) {
            const projectionsData = await projectionsRes.json();
            const filtered = projectionsData.results.map(p => ({
              id: p.id,
              name: p.name?.['en-GB'] || p.name?.['en'] || 'No name',
              sku: p.masterVariant?.sku || '',
              image: p.masterVariant?.images?.[0]?.url || null,
              prices: p.masterVariant?.prices || [],
            }));
            setProducts(filtered);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }

      setActiveFilter({ type: 'selection', id: selectionId, name: 'Product Selection' });
      setFilterSidebarOpen(false);
      setSearchQuery('');
      setSearchResultsCount(0);
    } catch (error) {
      console.error('Error fetching products by selection:', error);
      setProducts(allProducts);
    }
    setIsLoadingProducts(false);
  };

  const clearAllFilters = () => {
    setActiveFilter({ type: null, id: null, name: null });
    setProducts(allProducts);
    setSearchQuery('');
    setSearchResultsCount(0);
  };

  return (
    <>
      <Navbar onToggleFilters={() => setFilterSidebarOpen(!filterSidebarOpen)} />
      {filterSidebarOpen && (
        <FiltersSidebar
          categories={categories}
          onSelectCategory={fetchProductsByCategory}
          onSelectProductSelection={fetchProductsBySelection}
          onClose={() => setFilterSidebarOpen(false)}
          authToken={authToken}
        />
      )}

      <div style={{
        backgroundColor: '#ffffff',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
          {/* search bar + active filter UI untouched */}
          {/* ... keep all your filter UI here ... */}

          {(isLoadingProducts || isSearching) ? (
            // your spinner styling unchanged
            <div style={{
              textAlign: 'center',
              padding: '100px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'inline-block',
                width: '48px',
                height: '48px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #0d2340',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>
                {isSearching ? 'Searching products...' : 'Loading products...'}
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 24,
                }}
              >
                {products.map((product) => {
                  const applied = computeAppliedPrice(product.prices, resolvedGroup);
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <div
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          backgroundColor: '#ffffff',
                          overflow: 'hidden',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#d7e9f7';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <div style={{
                          height: '240px',
                          backgroundColor: '#f9fafb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid #e5e7eb'
                        }}>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }}
                            />
                          ) : (
                            <div style={{ color: '#d1d5db', fontSize: '48px' }}>📦</div>
                          )}
                        </div>

                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#0d2340',
                            marginBottom: '8px',
                            lineHeight: '1.4'
                          }}>
                            {product.name}
                          </h3>
                          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
                            SKU: {product.sku}
                          </p>
                          <div style={{ marginTop: 'auto' }}>
                            <p style={{ fontSize: '24px', fontWeight: '700', color: '#0d2340' }}>
                              {applied.text}
                            </p>
                            {resolvedGroup && (
                              <p style={{ fontSize: '12px', color: '#88cbff', marginTop: '4px', fontWeight: '500' }}>
                                {groupMap[applied.groupId]?.label || resolvedGroup.label} pricing applied
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* empty state unchanged */}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ----- SSR: initial load ----------------
export async function getServerSideProps(context) {
  try {
    const { getCTToken } = await import('../../lib/ctAuth.js');
    const { API } = await import('../../lib/ct-rest.js');
    const { access_token } = await getCTToken();

    const categoriesRes = await fetch(API('/categories?limit=100'), {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const categoriesData = await categoriesRes.json();

    const groupId = context.req.cookies?.customerGroupId || '';
    const qs = priceSelectionQS(groupId);

    const productsRes = await fetch(API(`/product-projections?limit=50${qs}`), {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const productsData = await productsRes.json();

    return {
      props: {
        initialCategories: (categoriesData.results || []).map((cat) => ({
          id: cat.id,
          name: cat.name?.['en-GB'] || cat.name?.['en'] || 'Unnamed',
        })),
        initialProducts: (productsData.results || []).map((p) => ({
          id: p.id,
          name: p.name?.['en-GB'] || p.name?.['en'] || 'No name',
          sku: p.masterVariant?.sku || '',
          image: p.masterVariant?.images?.[0]?.url || null,
          prices: p.masterVariant?.prices || [],
        })),
        authToken: access_token,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { props: { initialCategories: [], initialProducts: [], authToken: null } };
  }
}
