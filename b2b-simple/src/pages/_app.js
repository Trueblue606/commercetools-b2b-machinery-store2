// pages/_app.js
import '../styles/globals.css';
import { useEffect } from 'react';
import { CartProvider } from './contexts/CartContext'; // path is correct because _app.js is in /pages

export default function App({ Component, pageProps }) {
  // Purge stale storage if project key changed; namespace keys with chemb2b:
  useEffect(() => {
    try {
      const current = 'chemb2b';
      const markerKey = 'ct:projectKey';
      const prev = localStorage.getItem(markerKey);
      if (prev && prev !== current) {
        const toClear = ['authToken', 'refreshToken', 'cartId', 'anonymousId', 'customer'];
        for (const k of toClear) {
          localStorage.removeItem(k);
          localStorage.removeItem(`${prev}:${k}`);
          localStorage.removeItem(`${current}:${k}`); // ensure clean slate
        }
        document.cookie = `${current}:cartId=; Max-Age=0; path=/`;
        document.cookie = `${current}:customer=; Max-Age=0; path=/`;
      }
      localStorage.setItem(markerKey, current);
    } catch {}
  }, []);

  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}

// ⛔ Do NOT add App.getInitialProps here.
