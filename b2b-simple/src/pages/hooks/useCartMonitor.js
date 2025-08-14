// hooks/useCartMonitor.js - Optional hook for real-time cart monitoring
import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

export function useCartMonitor() {
  const { cart, fetchActiveCart } = useCart();

  useEffect(() => {
    // Set up an interval to periodically check cart status
    // This is useful if multiple tabs are open or if there are background updates
    const interval = setInterval(() => {
      const customer = localStorage.getItem('customer');
      if (customer) {
        console.log('Periodic cart refresh...');
        fetchActiveCart();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchActiveCart]);

  useEffect(() => {
    // Listen for storage changes (if cart is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'customer' || e.key === 'cart-updated') {
        console.log('Storage change detected, refreshing cart...');
        fetchActiveCart();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchActiveCart]);

  // Trigger a custom event when cart changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem('cart-updated', Date.now().toString());
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    }
  }, [cart]);

  return cart;
}