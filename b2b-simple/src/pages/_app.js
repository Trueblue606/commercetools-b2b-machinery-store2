// pages/_app.js
import '../styles/globals.css';
import { CartProvider } from './contexts/CartContext'; // path is correct because _app.js is in /pages

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}

// ⛔ Do NOT add App.getInitialProps here.
