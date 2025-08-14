// src/pages/contexts/CartContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

// 🔢 Money formatter
export const money = (centAmount = 0, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency })
    .format((centAmount || 0) / 100);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [error] = useState(null);
  const [loading, setLoading] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const selectedItemCount = selectedItems.size;

  // Real customer group IDs
  const groupMap = {
    catalogue: "5db880e5-3e15-4cc0-9cd1-2b214dd53f23",
    contract: "b2b1bafe-e36b-4d95-93c5-82ea07d7e159",
    asm: "48627f63-30a3-47d8-8d3d-4b1c30787a8a",
  };

  // Load cart on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cartId");
      if (stored) {
        fetch(`/api/cart/get?id=${stored}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => json && setCart(json))
          .catch(() => {});
      }
    } catch {}
  }, []);

  // Derived values
  const lineItems = cart?.lineItems || [];
  const currency = cart?.totalPrice?.currencyCode || "GBP";

  const selectedLineItems = useMemo(() => {
    if (!lineItems.length) return [];
    if (!selectedItems || selectedItems.size === 0) return lineItems;
    return lineItems.filter((li) => selectedItems.has(li.id));
  }, [lineItems, selectedItems]);

  const selectedTotalPrice = useMemo(() => {
    const centAmount = selectedLineItems.reduce(
      (sum, li) => sum + (li?.totalPrice?.centAmount || 0),
      0
    );
    return { currencyCode: currency, centAmount };
  }, [selectedLineItems, currency]);

  const itemCount = useMemo(
    () => lineItems.reduce((sum, li) => sum + (li.quantity || 0), 0),
    [lineItems]
  );

  // Selection helpers
  function toggleItemSelection(itemId) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }
  function selectAllItems() {
    if (lineItems.length) {
      setSelectedItems(new Set(lineItems.map((li) => li.id)));
    }
  }
  function deselectAllItems() {
    setSelectedItems(new Set());
  }

  // Create guest cart first
  async function createCart(customerGroupId, customerStoreKey) {
    const body = {
      currency: "GBP",
      customerGroupId: String(customerGroupId || groupMap.catalogue),
    };
    if (customerStoreKey) body.customerStoreKey = customerStoreKey;

    const res = await fetch("/api/cart/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());

    const json = await res.json();
    setCart(json);
    try {
      localStorage.setItem("cartId", json.id);
    } catch {}
    return json;
  }

  // 🔄 Safe cart update with retry on version conflict
  async function performCartUpdate(cartId, actionFn, maxRetries = 5) {
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt += 1;

      // Always fetch latest cart to get current version
      const latestRes = await fetch(`/api/cart/get?id=${encodeURIComponent(cartId)}`);
      if (!latestRes.ok) {
        const text = await latestRes.text().catch(() => 'Failed to fetch latest cart');
        throw new Error(text);
      }
      const latestCart = await latestRes.json();

      const res = await actionFn(latestCart);

      if (res.ok) {
        const json = await res.json();
        setCart(json); // keep your state setter
        try {
          localStorage.setItem('cartId', json.id);
        } catch {}
        return json;
      }

      // Inspect failure
      const raw = await res.text().catch(() => '');
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { /* raw stays string */ }

      const status = res.status;
      const code = parsed?.errors?.[0]?.code;

      const isConcurrent = status === 409 || code === 'ConcurrentModification';
      if (isConcurrent) {
        console.warn(`CT ConcurrentModification (attempt ${attempt}/${maxRetries}) – retrying`);
        const delay = Math.min(1000, 150 * attempt) + Math.floor(Math.random() * 100);
        await new Promise(r => setTimeout(r, delay));
        continue; // next loop with newer version
      }

      // Not retryable – surface error
      throw new Error(parsed?.message || raw || 'Cart update failed');
    }

    throw new Error('Cart update failed after retries (ConcurrentModification).');
  }

  // Link cart to customer
// Link cart to customer + ensure addresses are on the cart
async function setCartCustomer(cartId, customerId, customerGroupId) {
  // 1) Attach the customer (and group) to the cart
  const attachedCart = await performCartUpdate(cartId, (latestCart) =>
    fetch("/api/cart/set-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId: latestCart.id,
        version: latestCart.version,
        customerId,
        customerGroupId,
      }),
    })
  );

  // 2) If addresses are missing, copy defaults from the customer onto the cart
  if (!attachedCart?.shippingAddress || !attachedCart?.billingAddress) {
    const resp = await fetch("/api/cart/set-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: attachedCart.id, customerId }),
    });

    if (resp.ok) {
      const cartWithAddresses = await resp.json();
      // If your context holds cart state, update it here:
      if (typeof setCart === "function") setCart(cartWithAddresses);
      return cartWithAddresses;
    } else {
      // Optional: log but don’t block checkout
      console.warn("set-address failed:", await resp.text());
    }
  }

  return attachedCart;
}



  // Add item to cart
  async function addItem(sku, quantity = 1) {
    let currentCart = cart;
    if (!currentCart) {
      currentCart = await createCart(groupMap.catalogue);
    }
    setLoading(true);

    try {
      return await performCartUpdate(currentCart.id, (latestCart) =>
        fetch("/api/cart/add-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartId: latestCart.id,
            version: latestCart.version,
            sku,
            quantity,
          }),
        })
      );
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(_productId, sku, quantity = 1) {
    return addItem(sku, quantity);
  }

  // Quantity update
  async function updateQuantity(lineItemId, quantity) {
    if (!cart) return null;
    if (quantity <= 0) return removeFromCart(lineItemId);

    return performCartUpdate(cart.id, (latestCart) =>
      fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: latestCart.id,
          version: latestCart.version,
          actions: [
            { action: "changeLineItemQuantity", lineItemId, quantity },
          ],
        }),
      })
    );
  }

  // Remove item
  async function removeFromCart(lineItemId) {
    if (!cart) return null;

    return performCartUpdate(cart.id, (latestCart) =>
      fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: latestCart.id,
          version: latestCart.version,
          actions: [{ action: "removeLineItem", lineItemId }],
        }),
      })
    ).then((json) => {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(lineItemId);
        return next;
      });
      return json;
    });
  }

  // Set customer group
  async function setCartCustomerGroup(groupKey = "catalogue") {
    if (!cart) return null;

    return performCartUpdate(cart.id, (latestCart) =>
      fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: latestCart.id,
          version: latestCart.version,
          actions: [
            {
              action: "setCustomerGroup",
              customerGroup: {
                typeId: "customer-group",
                id: groupMap[groupKey] || groupKey,
              },
            },
          ],
        }),
      })
    );
  }

  // Clear cart
  function clearCart() {
    setCart(null);
    setSelectedItems(new Set());
    try {
      localStorage.removeItem("cartId");
    } catch {}
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        createCart,
        addItem,
        addToCart,
        setCartCustomer,
        setCartCustomerGroup,
        updateQuantity,
        removeFromCart,
        clearCart,

        selectedItems,
        toggleItemSelection,
        selectAllItems,
        deselectAllItems,
        selectedItemCount,

        selectedLineItems,
        selectedTotalPrice,
        currency,
        itemCount,

        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
