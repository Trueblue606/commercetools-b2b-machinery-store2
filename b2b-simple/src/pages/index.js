// pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/components/navbar.js';
import FiltersSidebar from '../components/components/FiltersSidebar.js';
import SearchBar from '@/components/SearchBar';
import InteractiveFlowBanner from '../components/components/InteractiveFlowBanner.js';

// Sets a title ONLY if no title is currently set (does nothing if you already set one elsewhere)
function useTitleIfMissing(title = 'POC Scoped: True Pricing B2B') {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const current = (document.title || '').trim();
      if (!current) document.title = title;
    }
  }, [title]);
}

const PRICE_CURRENCY = process.env.NEXT_PUBLIC_CT_PRICE_CURRENCY || 'GBP';
const PRICE_COUNTRY  = process.env.NEXT_PUBLIC_CT_PRICE_COUNTRY  || 'GB';

// ----- shared group map (same as Navbar) -----
const groupMap = {
  'd7a14b96-ca48-4a3f-b35d-6bce624e3b16': { key: 'standard',     label: 'Standard' },
  'fc05910d-ec00-4d7a-abaa-967d352af9fc': { key: 'testoverlap',  label: 'Test Overlap' },
  '68baca5b-b96b-4751-9f85-215fb1a7417c': { key: 'special',      label: 'Special Project' },
  'a1aff334-3def-4937-9116-5f2f96f93214': { key: 'distributor',  label: 'Distributor' },
  '20304c81-f448-4c7e-9231-ba55488251e5': { key: 'contractA',    label: 'Contract A' },
};

// build CT querystring
function priceSelectionQS(groupId) {
  const params = new URLSearchParams();
  if (PRICE_CURRENCY) params.set('priceCurrency', PRICE_CURRENCY);
  if (PRICE_COUNTRY)  params.set('priceCountry',  PRICE_COUNTRY);
  if (groupId)        params.set('priceCustomerGroup', groupId);
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
  useTitleIfMissing('POC Scoped: True Pricing B2B');

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

  // ---------------- UI ONLY (polish) ----------------
  const brandBlue = '#0a0a0a';
  const lightBlue = '#d7e9f7';

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

      {/* === Banner: Title + Flow (full width) === */}
      <div style={{ background: '#0a0a0a' }}>
        <InteractiveFlowBanner />
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          minHeight: 'calc(100vh - 64px)',
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
          {/* Search */}
          <div style={{ marginBottom: 24 }}>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isSearching}
              value={searchQuery}
            />
          </div>

          {/* Active Filter Banner */}
          {(activeFilter.type || searchQuery) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: lightBlue,
                border: `1px solid ${brandBlue}22`,
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: brandBlue,
                    borderRadius: 999,
                  }}
                />
                <span style={{ fontSize: 14, color: brandBlue, fontWeight: 600 }}>
                  {activeFilter.type === 'category' && `Category: ${activeFilter.name}`}
                  {activeFilter.type === 'selection' && `Selection: ${activeFilter.name}`}
                  {activeFilter.type === 'search' && (
                    <>
                      {`Search: ${activeFilter.name}`}
                      {searchResultsCount > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>
                          ({searchResultsCount} results)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={clearAllFilters}
                style={{
                  background: 'transparent',
                  border: `1px solid ${brandBlue}55`,
                  color: brandBlue,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
                aria-label="Clear all filters"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Loading */}
          {(isLoadingProducts || isSearching) ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
              }}
            >
              <div style={{ position: 'relative', width: 56, height: 56 }}>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '4px solid #e5e7eb',
                    borderTopColor: brandBlue,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }}
                />
              </div>
              <h2 style={{ marginTop: 16, fontSize: 18, color: '#0a0a0a', fontWeight: 600 }}>
                {isSearching ? 'Searching products…' : 'Loading products…'}
              </h2>
              <p style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                Please wait while we fetch the latest information
              </p>
            </div>
          ) : (
            <>
              {products.length > 0 ? (
                <>
                  {/* Header */}
                  <div style={{ marginBottom: 16 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>
                      {activeFilter.type === 'search'
                        ? 'Search Results'
                        : activeFilter.type === 'category'
                        ? activeFilter.name
                        : activeFilter.type === 'selection'
                        ? 'Product Selection'
                        : 'All Products'}
                    </h1>
                    <p style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                      Showing {products.length} product{products.length !== 1 ? 's' : ''}
                      {resolvedGroup && (
                        <span style={{ marginLeft: 8, color: '#2563eb', fontWeight: 600 }}>
                          • {` ${resolvedGroup.label} pricing applied`}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Grid */}
                  <div
                    className="productsGrid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {products.map((product) => {
                      const applied = computeAppliedPrice(product.prices, resolvedGroup);
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <article
                            role="article"
                            tabIndex={0}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              border: '1px solid #e5e7eb',
                              borderRadius: 12,
                              backgroundColor: '#fff',
                              transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
                              overflow: 'hidden',
                              outline: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                          >
                            {/* Image */}
                            <div
                              style={{
                                aspectRatio: '1 / 1',
                                background: '#f9fafb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderBottom: '1px solid #f3f4f6',
                                overflow: 'hidden',
                              }}
                            >
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    padding: 16,
                                    transition: 'transform .25s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                />
                              ) : (
                                <div style={{ fontSize: 48, color: '#d1d5db' }}>📦</div>
                              )}
                            </div>

                            {/* Body */}
                            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <h3
                                style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  color: '#0a0a0a',
                                  margin: 0,
                                  marginBottom: 6,
                                  lineHeight: 1.35,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={product.name}
                              >
                                {product.name}
                              </h3>
                              <p style={{ margin: 0, marginBottom: 14, color: '#6b7280', fontSize: 12 }}>
                                SKU: {product.sku || 'N/A'}
                              </p>

                              <div style={{ marginTop: 'auto' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0a0a0a' }}>
                                    {applied.text}
                                  </p>
                                  {applied.text !== 'Contact for price' && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: '#065f46',
                                        background: '#ecfdf5',
                                        border: '1px solid #10b98155',
                                        padding: '3px 8px',
                                        borderRadius: 999,
                                        fontWeight: 700,
                                      }}
                                    >
                                      Available
                                    </span>
                                  )}
                                </div>

                                {resolvedGroup && applied.groupId && (
                                  <p
                                    style={{
                                      marginTop: 8,
                                      marginBottom: 0,
                                      display: 'inline-block',
                                      fontSize: 12,
                                      color: '#1e40af',
                                      background: '#eff6ff',
                                      border: '1px solid #93c5fd88',
                                      padding: '4px 8px',
                                      borderRadius: 8,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {(groupMap[applied.groupId]?.label || resolvedGroup.label) + ' pricing'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                // Empty state
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 20px',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: '#f3f4f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 21l-6-6" />
                      <circle cx="10" cy="10" r="7" />
                    </svg>
                  </div>
                  <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 700, color: '#0a0a0a' }}>
                    {activeFilter.type === 'search' ? 'No search results found' : 'No products found'}
                  </h2>
                  <p style={{ margin: 0, marginBottom: 16, maxWidth: 520, textAlign: 'center', color: '#6b7280' }}>
                    {activeFilter.type === 'search'
                      ? `We couldn't find any products matching "${searchQuery}". Try adjusting your search terms.`
                      : 'There are no products available in this category at the moment.'}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    style={{
                      background: brandBlue,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View All Products
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* UI-only: small responsive + focus styles */}
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .productsGrid { gap: 16px; }
        }
        @media (max-width: 480px) {
          .productsGrid { grid-template-columns: 1fr !important; }
        }
        a:focus-visible article {
          box-shadow: 0 0 0 3px rgba(10,10,10,0.18) !important;
          border-color: #0a0a0a !important;
        }
        button:focus-visible {
          outline: 2px solid #0a0a0a;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}

// ----- SSR: initial load ----------------

export async function getServerSideProps(context) {
  if (context?.res?.setHeader) { context.res.setHeader("x-gssp","1"); }
  try {
    const { ctGet } = await import('@/lib/ct-rest');

    // Categories
    const cats = await ctGet('/categories?limit=100');

    // Price selection (optional customer group from cookie)
    const groupId = context.req.cookies?.customerGroupId || '';

    const sp = new URLSearchParams();
    sp.set('limit', '10');
    sp.set('staged', 'true');
    sp.set('sort', 'lastModifiedAt desc'); // ✅ valid CT sort field
    sp.set('priceCurrency', 'GBP');
    sp.set('priceCountry', 'GB');
    if (groupId) sp.set('priceCustomerGroup', groupId);

    // Products
    const prods = await ctGet(`/product-projections?${sp.toString()}`);

    return {
      props: {
        initialCategories: (cats.results || []).map((cat) => ({
          id: cat.id,
          name: (cat.name && (cat.name['en-GB'] || cat.name['en'])) || 'Unnamed',
        })),
        initialProducts: (prods.results || []).map((p) => ({
          id: p.id,
          name: (p.name && (p.name['en-GB'] || p.name['en'])) || 'No name',
          sku: (p.masterVariant && p.masterVariant.sku) || '',
          image: (p.masterVariant && p.masterVariant.images && p.masterVariant.images[0] && p.masterVariant.images[0].url) || null,
          prices: (p.masterVariant && p.masterVariant.prices) || [],
        })),
        // Never return undefined from GSSP
        authToken: null,
      },
    };
  } catch (e) {
    console.error('Error in getServerSideProps:', e);
    return { props: { initialCategories: [], initialProducts: [], authToken: null } };
  }
}