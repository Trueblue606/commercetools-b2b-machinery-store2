// pages/_app.js
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import Navbar from '../components/components/navbar';
import FiltersSidebar from '../components/components/FiltersSidebar';
import { CartProvider } from './contexts/CartContext';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [authToken, setAuthToken] = useState(null);

  // Load categories once
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error(`categories ${res.status}`);
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setAuthToken(data.authToken || null);
      } catch (e) {
        console.error('Failed to load categories:', e);
        setCategories([]);
      }
    }
    load();
  }, []);

  const handleSelectCategory = (categoryId) => {
    setFilterSidebarOpen(false);
    const next = { ...router.query };
    delete next.selectionId;
    if (categoryId) next.categoryId = categoryId;
    else delete next.categoryId;
    router.push({ pathname: '/', query: next }, undefined, { shallow: true });
  };

  const handleSelectProductSelection = (selectionId) => {
    setFilterSidebarOpen(false);
    const next = { ...router.query };
    delete next.categoryId;
    if (selectionId) next.selectionId = selectionId;
    else delete next.selectionId;
    router.push({ pathname: '/', query: next }, undefined, { shallow: true });
  };

  return (
    <CartProvider>
      {/* ✅ Navbar only on non-home routes */}
      {router.pathname !== '/' && (
        <Navbar onToggleFilters={() => setFilterSidebarOpen((v) => !v)} />
      )}

      {filterSidebarOpen && (
        <FiltersSidebar
          categories={categories}
          authToken={authToken}
          onClose={() => setFilterSidebarOpen(false)}
          onSelectCategory={handleSelectCategory}
          onSelectProductSelection={handleSelectProductSelection}
        />
      )}

      <Component {...pageProps} />
    </CartProvider>
  );
}
