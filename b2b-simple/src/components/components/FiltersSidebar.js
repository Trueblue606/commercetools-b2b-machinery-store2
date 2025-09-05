// components/FiltersSidebar.js
import { useState } from 'react';

export default function FiltersSidebar({
  categories = [],
  onSelectCategory = () => {},
  onClose,
}) {
  // ✅ Fallback categories (used if prop is empty)
  const DEFAULT_CATEGORIES = [
    { id: '2965b6a2-c85e-4bf6-b46d-2718f09cdc4e', name: 'Catalogue' },
    { id: '92aaadb5-ddeb-4ece-bad4-2657fead7a74', name: 'Chemicals' },
    { id: '34b06a3e-47e8-4d28-8ba2-652acaba3f05', name: 'Equipment' },
    { id: '8dd53d61-d8a4-49a0-9513-22ba413b0001', name: 'Protective Gear' },
    { id: '4fa7db3e-4ba1-4b16-bfac-4792d8698796', name: 'Monitoring & Traps' },
    { id: '82f5c125-56e7-4fca-9091-da5600371a88', name: 'Bundles & Kits' },
  ];

  const cats = Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORIES;

  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const handleCategoryClick = (categoryId) => {
    setActiveCategoryId(categoryId);
    onSelectCategory(categoryId);
  };

  const clearAll = () => {
    setActiveCategoryId(null);
    onSelectCategory(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1099,
          cursor: 'pointer',
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: '700',
              color: '#0d2340',
            }}
          >
            Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '16px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '6px 10px',
            }}
          >
            Close
          </button>
        </div>

        {/* Active filter pill */}
        {activeCategoryId && (
          <div
            style={{
              margin: '16px 32px 0',
              padding: '10px 14px',
              backgroundColor: '#d7e9f7',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 14,
              color: '#0d2340',
              fontWeight: 500,
            }}
          >
            1 filter applied
            <button
              onClick={clearAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#0d2340',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 32px 24px',
          }}
        >
          {/* Categories */}
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6b7280',
                margin: '16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>📁</span>
              CATEGORIES
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.map((cat) => {
                const active = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      background: active ? '#d7e9f7' : '#ffffff',
                      border: `2px solid ${active ? '#0d2340' : '#d7e9f7'}`,
                      padding: '14px 18px',
                      color: '#0d2340',
                      cursor: 'pointer',
                      fontSize: 14,
                      textAlign: 'left',
                      width: '100%',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                      borderRadius: 10,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = '#0d2340';
                        e.currentTarget.style.backgroundColor = '#eef6fd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = '#d7e9f7';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 32px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 14,
              backgroundColor: '#0d2340',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
