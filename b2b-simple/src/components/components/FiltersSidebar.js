// components/FiltersSidebar.js
import { useState, useEffect } from 'react';

export default function FiltersSidebar({ 
  categories, 
  onSelectCategory, 
  onSelectProductSelection,
  onClose,
  authToken 
}) {
  const [productSelections, setProductSelections] = useState([]);
  const [loadingSelections, setLoadingSelections] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ type: null, id: null });

  useEffect(() => {
    fetchProductSelections();
  }, []);

  const fetchProductSelections = async () => {
    if (!authToken) {
      setLoadingSelections(false);
      return;
    }

    try {
      const res = await fetch(
        'https://api.eu-central-1.aws.commercetools.com/chempilot/product-selections?limit=100',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProductSelections(data.results.map(selection => ({
          id: selection.id,
          name: selection.name?.['en-GB'] || selection.name?.['en'] || selection.key || 'Unnamed',
          productCount: selection.productCount || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching product selections:', error);
    }
    setLoadingSelections(false);
  };

  const handleCategoryClick = (categoryId) => {
    setActiveFilter({ type: 'category', id: categoryId });
    onSelectCategory(categoryId);
  };

  const handleSelectionClick = (selectionId) => {
    setActiveFilter({ type: 'selection', id: selectionId });
    onSelectProductSelection(selectionId);
  };

  const clearAllFilters = () => {
    setActiveFilter({ type: null, id: null });
    onSelectCategory(null);
    onSelectProductSelection(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1099,
          cursor: 'pointer'
        }}
      />
      
      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 380,
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          zIndex: 1100,
          fontFamily: "'Outfit', sans-serif",
          transform: 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Fixed */}
        <div style={{
          padding: '20px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            color: '#0d2340',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px'
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
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          className="filter-sidebar-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d7e9f7 #ffffff'
          }}
        >
          {/* Active Filter Indicator */}
          {activeFilter.type && (
            <div style={{
              margin: '20px 32px',
              padding: '12px 16px',
              backgroundColor: '#d7e9f7',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#0d2340',
                fontWeight: '500'
              }}>
                1 filter applied
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0d2340',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Clear
              </button>
            </div>
          )}

          <div style={{ padding: '0 32px 32px' }}>
            {/* Product Selections Section */}
            {productSelections.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b7280',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  <span style={{ fontSize: '18px' }}>⭐</span>
                  COLLECTIONS
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productSelections.map(selection => (
                    <button
                      key={selection.id}
                      onClick={() => handleSelectionClick(selection.id)}
                      style={{
                        background: activeFilter.type === 'selection' && activeFilter.id === selection.id 
                          ? '#d7e9f7' : '#ffffff',
                        border: activeFilter.type === 'selection' && activeFilter.id === selection.id
                          ? '2px solid #0d2340' : '2px solid #e5e7eb',
                        padding: '14px 18px',
                        color: '#0d2340',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        width: '100%',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontFamily: "'Outfit', sans-serif"
                      }}
                      onMouseEnter={e => {
                        if (activeFilter.type !== 'selection' || activeFilter.id !== selection.id) {
                          e.currentTarget.style.borderColor = '#0d2340';
                          e.currentTarget.style.backgroundColor = '#d7e9f7';
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeFilter.type !== 'selection' || activeFilter.id !== selection.id) {
                          e.currentTarget.style.borderColor = '#d7e9f7';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <span>{selection.name}</span>
                      {selection.productCount > 0 && (
                        <span style={{
                          backgroundColor: activeFilter.type === 'selection' && activeFilter.id === selection.id
                            ? '#0d2340' : '#d7e9f7',
                          color: activeFilter.type === 'selection' && activeFilter.id === selection.id
                            ? '#ffffff' : '#0d2340',
                          padding: '2px 10px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {selection.productCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {productSelections.length > 0 && (
              <div style={{
                height: '1px',
                backgroundColor: '#d7e9f7',
                margin: '32px 0'
              }} />
            )}

            {/* Categories Section */}
            <div>
              <h3 style={{
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Outfit', sans-serif"
              }}>
                <span style={{ fontSize: '18px' }}>📁</span>
                CATEGORIES
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      background: activeFilter.type === 'category' && activeFilter.id === cat.id 
                        ? '#d7e9f7' : '#ffffff',
                      border: activeFilter.type === 'category' && activeFilter.id === cat.id
                        ? '2px solid #0d2340' : '2px solid #d7e9f7',
                      padding: '14px 18px',
                      color: '#0d2340',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      width: '100%',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      borderRadius: '10px',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                    onMouseEnter={e => {
                      if (activeFilter.type !== 'category' || activeFilter.id !== cat.id) {
                        e.currentTarget.style.borderColor = '#0d2340';
                        e.currentTarget.style.backgroundColor = '#d7e9f7';
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeFilter.type !== 'category' || activeFilter.id !== cat.id) {
                        e.currentTarget.style.borderColor = '#d7e9f7';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div style={{
          padding: '24px 32px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#0d2340',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Outfit', sans-serif"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#0a1c33';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 35, 64, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#0d2340';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}