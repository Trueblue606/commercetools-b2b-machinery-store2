// pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from './components/navbar';
import FiltersSidebar from './components/FiltersSidebar';
import SearchBar from './components/SearchBar';

const CATALOGUE_GROUP_ID = '5db880e5-3e15-4cc0-9cd1-2b214dd53f23'; // catalogue
const PRICE_CURRENCY = 'GBP';
const PRICE_COUNTRY = 'GB';

function priceSelectionQS(groupId) {
  const params = new URLSearchParams();
  if (PRICE_CURRENCY) params.set('priceCurrency', PRICE_CURRENCY);
  if (PRICE_COUNTRY) params.set('priceCountry', PRICE_COUNTRY);
  if (groupId) params.set('priceCustomerGroup', groupId);
  const s = params.toString();
  return s ? `&${s}` : '';
}

// Gather ALL group ids (primary + assignments)
function customerGroupIds(customer) {
  if (!customer) return [];
  const ids = [];
  if (customer.customerGroup?.id) ids.push(customer.customerGroup.id);
  if (Array.isArray(customer.customerGroupAssignments)) {
    for (const a of customer.customerGroupAssignments) {
      const id = a?.customerGroup?.id || a?.id;
      if (id) ids.push(id);
    }
  }
  return [...new Set(ids)];
}

// Compute which price is actually applied and from which group
function computeAppliedPrice(prices, customer) {
  if (!Array.isArray(prices) || prices.length === 0) return { text: 'Contact for price', groupId: null };

  const ids = customerGroupIds(customer);

  // Prefer any price matching the customer's groups
  for (const price of prices) {
    const pg = price.customerGroup?.id;
    if (pg && ids.includes(pg)) {
      const v = price.discounted?.value || price.value;
      return { text: `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`, groupId: pg };
    }
  }

  // Fallback: catalogue
  const catalogue = prices.find(p => p.customerGroup?.id === CATALOGUE_GROUP_ID);
  if (catalogue) {
    const v = catalogue.discounted?.value || catalogue.value;
    return { text: `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`, groupId: CATALOGUE_GROUP_ID };
  }

  // Fallback: base price (no group)
  const base = prices.find(p => !p.customerGroup);
  if (base) {
    const v = base.discounted?.value || base.value;
    return { text: `${v.currencyCode} ${(v.centAmount / 100).toFixed(2)}`, groupId: null };
  }

  return { text: 'Contact for price', groupId: null };
}

function groupIdToName(id) {
  const map = {
    '48627f63-30a3-47d8-8d3d-4b1c30787a8a': 'ASM',
    'b2b1bafe-e36b-4d95-93c5-82ea07d7e159': 'contract',
    '5db880e5-3e15-4cc0-9cd1-2b214dd53f23': 'catalogue',
  };
  if (!id) return 'catalogue';
  return map[id] || 'member';
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

  // load customer from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('customer');
      if (stored) setCustomer(JSON.parse(stored));
    } catch {}
  }, []);

  // re-render on customer change → refresh price labels
  useEffect(() => {
    if (customer) setProducts(prev => [...prev]);
  }, [customer]);

  // Search (kept, now passes price selection)
  const handleSearch = async (query) => {
    setIsSearching(true);
    setSearchQuery(query);

    try {
      const groupId = customer?.customerGroup?.id || '';
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=50${priceSelectionQS(groupId)}`);
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

  // Category (calls your API; now sends price selection)
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
      const groupId = customer?.customerGroup?.id || '';
      const res = await fetch(`/api/products-by-category?categoryId=${categoryId}${priceSelectionQS(groupId)}`);
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

  // Product selection (direct CT API; now sends price selection)
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
      // 1) get product ids in the selection
      const productsRes = await fetch(
        `https://api.eu-central-1.aws.commercetools.com/chempilot/product-selections/${selectionId}/products?limit=100`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productIds = productsData.results.map(p => p.product.id);

        if (productIds.length > 0) {
          const whereClause = productIds.map(id => `"${id}"`).join(',');
          const groupId = customer?.customerGroup?.id || '';
          const url =
            `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections` +
            `?where=id%20in%20(${encodeURIComponent(whereClause)})&limit=100${priceSelectionQS(groupId)}`;

          const projectionsRes = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });

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
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isSearching={isSearching}
              authToken={authToken}
            />
          </div>

          {activeFilter.type && (
            <div style={{
              marginBottom: 24,
              padding: '14px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', opacity: 0.8 }}>
                  {activeFilter.type === 'search' ? '🔍' :
                    activeFilter.type === 'selection' ? '⭐' : '📁'}
                </span>
                <span style={{ color: '#0d2340', fontSize: '15px', fontWeight: '500' }}>
                  {activeFilter.type === 'search' ? 'Search' :
                    activeFilter.type === 'selection' ? 'Collection' : 'Category'}:
                  <strong style={{ marginLeft: '6px' }}>{activeFilter.name}</strong>
                </span>
                {activeFilter.type === 'search' && searchResultsCount > 0 && (
                  <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '400' }}>
                    ({searchResultsCount} results)
                  </span>
                )}
              </div>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#0d2340';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear filter
              </button>
            </div>
          )}

          {(isLoadingProducts || isSearching) ? (
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
                  const applied = computeAppliedPrice(product.prices, customer);
                  const appliedName = groupIdToName(applied.groupId);
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
                            {customer && (
                              <p style={{ fontSize: '12px', color: '#88cbff', marginTop: '4px', fontWeight: '500' }}>
                                {appliedName} pricing applied
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {products.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>
                    {activeFilter.type === 'search' ? '🔍' : '📦'}
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: '#0d2340', marginBottom: '8px' }}>
                    {activeFilter.type === 'search' ?
                      `No products found for "${searchQuery}"` :
                      'No products found'
                    }
                  </p>
                  <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
                    {activeFilter.type === 'search' ?
                      'Try different keywords or browse all products' :
                      'Try adjusting your filters or browse all products'
                    }
                  </p>
                  <button
                    onClick={clearAllFilters}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#0d2340',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#0a1c33';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 35, 64, 0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#0d2340';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
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
    </>
  );
}

// ----- SSR: initial load (optionally filtered by cookie) --------------------
export async function getServerSideProps(context) {
  const fetchAuthToken = async () => {
    const authRes = await fetch(
      'https://auth.eu-central-1.aws.commercetools.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            (process.env.CT_CLIENT_ID || '') + ':' + (process.env.CT_CLIENT_SECRET || '')
          ).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      }
    );
    const auth = await authRes.json();
    return auth.access_token;
  };

  try {
    const token = await fetchAuthToken();

    const categoriesRes = await fetch(
      'https://api.eu-central-1.aws.commercetools.com/chempilot/categories?limit=100',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const categoriesData = await categoriesRes.json();

    // If you set a cookie "customerGroupId" after login, SSR can pre-filter
    const groupId = context.req.cookies?.customerGroupId || '';
    const qs = priceSelectionQS(groupId);

    const productsRes = await fetch(
      `https://api.eu-central-1.aws.commercetools.com/chempilot/product-projections?limit=50${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
        authToken: token,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { props: { initialCategories: [], initialProducts: [], authToken: null } };
  }
}
