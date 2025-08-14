// src/pages/checkout.js - COMPLETE FIXED VERSION
import { useEffect, useMemo, useState } from "react";
import { useCart } from "./contexts/CartContext";
import Navbar from "./components/navbar";
import { useRouter } from "next/router";

export default function Checkout() {
  const router = useRouter();
  const {
    cart,
    loading,
    selectedItems,
    selectedLineItems,
    selectedItemCount,
    selectedTotalPrice, // may be CT Money object in some contexts; not rendered directly
    currency,
    customer,
    clearCart,
  } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    // Shipping Address
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'GB',

    // Order Notes
    orderNotes: '',
    billingSame: true,
  });

  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [methods, setMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
    { id: 1, title: 'Review Items', description: 'Selected products' },
    { id: 2, title: 'Shipping Info', description: 'Delivery details' },
    { id: 3, title: 'Order Review', description: 'Final confirmation' },
  ];

  // Pre-fill customer data if logged in
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
      }));
    }
  }, [customer]);

  // Redirect if no items selected
  useEffect(() => {
    if (!loading && selectedItemCount === 0) {
      router.push('/cart');
    }
  }, [loading, selectedItemCount, router]);

  // Prefill when cart becomes available / changes
  useEffect(() => {
    if (!cart) return;
    const sa = cart.shippingAddress || {};
    const ba = cart.billingAddress || {};
    setForm({
      firstName: sa.firstName || "",
      lastName: sa.lastName || "",
      email: sa.email || "",
      phone: sa.phone || "",
      address: sa.streetName || "",
      city: sa.city || "",
      postalCode: sa.postalCode || sa.postal || "",
      country: sa.country || "GB",

      // Order Notes
      orderNotes: '',
      billingSame: !ba || JSON.stringify(ba) === JSON.stringify(sa),
    });
    // selected shipping method if present
    setSelectedMethodId(cart.shippingInfo?.shippingMethod?.id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateStep2 = () => {
    const errors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode'];

    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) {
        errors[field] = 'This field is required';
      }
    });

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ---- Derived totals (from line items) -------------------------------------
  const items = Array.isArray(selectedLineItems) ? selectedLineItems : [];
  const subtotalCents = items.reduce((sum, item) => sum + getItemCentAmount(item), 0);
  const subtotal = Number(formatAmountFromCents(subtotalCents)); // numeric major units
  const shippingCostCents = subtotalCents >= 500 * 100 ? 0 : 25 * 100; // free shipping at 500
  const shippingCost = Number(formatAmountFromCents(shippingCostCents));
  const finalTotalCents = subtotalCents + shippingCostCents;
  const finalTotal = Number(formatAmountFromCents(finalTotalCents));
  const moreForFreeShipping = Math.max(0, 500 - subtotal);
  // --------------------------------------------------------------------------

  const handleSubmitOrder = async () => {
    setOrderSubmitting(true);

    try {
      const storedCustomer = typeof window !== 'undefined' ? localStorage.getItem('customer') : null;
      const customerData = storedCustomer ? JSON.parse(storedCustomer) : customer;

      console.log('=== CHECKOUT SUBMISSION ===');
      console.log('Customer:', customerData);
      console.log('Customer Group ID:', customerData?.customerGroup?.id || 'NONE');
      console.log('Selected items count:', items.length);
      console.log('Subtotal:', subtotal);
      console.log('Shipping cost:', shippingCost);
      console.log('Final total:', finalTotal);

      // Create order payload (prices are still CT Money on line items)
      const orderPayload = {
        cartId: cart?.id,
        cartVersion: cart?.version,
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          streetName: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        billingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          streetName: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        customerEmail: form.email,
        orderNotes: form.orderNotes,
        lineItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: {
            id: item.variant?.id || 1,
            sku: item.variant?.sku,
          },
          name: item.name,
          price: item.price,
          totalPrice: item.totalPrice,
        })),
        customer: customerData,
        shippingCost,
        requiresShipping: shippingCost > 0,
      };

      console.log('Submitting order...');

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const { text, json } = await readBodySafe(response);

      if (!response.ok) {
        // Build a helpful message from JSON or text
        const errMsg =
          json?.message ||
          json?.error ||
          (typeof json === 'object' && json ? JSON.stringify(json) : '') ||
          text ||
          `Order API error (HTTP ${response.status})`;
        throw new Error(errMsg);
      }

      // Require JSON success payload
      if (!json || typeof json !== 'object') {
        throw new Error('Unexpected empty or non-JSON response from order API');
      }

      if (!json.success) {
        throw new Error(json.message || json.error || 'Failed to create order');
      }

      // Make sure we have the order data
      if (!json.id || !json.orderNumber) {
        throw new Error('Order created but missing order details');
      }

      console.log('Order created successfully:', {
        id: json.id,
        orderNumber: json.orderNumber,
        total: json.totalPrice,
      });

      // Store complete order info for success page
      const orderInfo = {
        orderNumber: json.orderNumber,
        id: json.id,
        totalPrice: json.totalPrice,
        taxedPrice: json.taxedPrice,
        customerEmail: json.customerEmail || formData.email,
        createdAt: json.createdAt,
        shippingCost,
        lineItems: json.lineItems || items,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrder', JSON.stringify(orderInfo));
        localStorage.removeItem('selected_items');
      }

      // Clear cart state
      if (clearCart) clearCart();

      // Small delay to ensure localStorage is written
      setTimeout(() => {
        router.push('/order-success');
      }, 100);
    } catch (error) {
      console.error('Order submission failed:', error);
      alert(`Order submission failed: ${error.message}`);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // small helper to show totals (centAmount -> currency)
  function renderTotals(c) {
    if (!c) return null;
    const tp = c.totalPrice || c.totalPrice || null;
    let label = "";
    if (tp && typeof tp.centAmount === "number") {
      const amount = (tp.centAmount / 100).toFixed(2);
      label = `${c.totalPrice?.currencyCode || "GBP"} ${amount}`;
    } else if (c.totalPrice) {
      label = JSON.stringify(c.totalPrice);
    } else {
      label = "—";
    }
    return (
      <div>
        <strong>Cart totals:</strong> {label}
      </div>
    );
  }

  // Immediate load of methods when user opens checkout and cart exists
  useEffect(() => {
    if (!cart?.id) return;
    handleLoadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  // -- helpers added to restore missing functions --------------------------------
  /**
   * Alias because some inputs call setForm(...) while state is formData/setFormData
   */
  const formData = form;
  const setFormData = setForm;

  /**
   * Safely extract cents from a line item shape that may be CT projection or simplified.
   */
  function getItemCentAmount(item) {
    if (!item) return 0;
    // Try totalPrice.centAmount first (usually the final per-line total)
    const total = item.totalPrice?.centAmount ?? item.totalPrice?.value?.centAmount;
    if (typeof total === 'number') return total;
    // Try price value (unit price) * quantity
    const unit = item.price?.value?.centAmount ?? item.price?.centAmount ?? item.price?.centAmount;
    const qty = item.quantity ?? 1;
    if (typeof unit === 'number') return unit * qty;
    // Some shapes may include lineTotal or grossPrice
    if (item.lineTotal?.centAmount) return item.lineTotal.centAmount;
    return 0;
  }

  /**
   * Convert cents to a minor/major string like "12.34"
   */
  function formatAmountFromCents(cents) {
    if (typeof cents !== 'number') return '0.00';
    return (cents / 100).toFixed(2);
  }

  /**
   * Read response body safely and attempt json parse
   */
  async function readBodySafe(response) {
    const text = await response.text().catch(() => '');
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { text, json };
  }

  /**
   * Load shipping methods for the current cart (used by effects and after saving address)
   */
  async function handleLoadMethods() {
    if (!cart?.id) {
      setMethods([]);
      return [];
    }
    try {
      const r = await fetch(`/api/cart/shipping-methods?cartId=${encodeURIComponent(cart.id)}`);
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        setError(j || `Failed to load shipping methods (${r.status})`);
        setMethods([]);
        return [];
      }
      const list = await r.json().catch(() => []);
      setMethods(list || []);
      return list || [];
    } catch (e) {
      setError(String(e));
      setMethods([]);
      return [];
    }
  }

  /**
   * Save addresses to cart (updates cart and reloads methods)
   */
  async function saveAddresses() {
    if (!cart?.id) {
      setError('No cart available');
      return;
    }
    setError(null);
    try {
      const shippingAddress = {
        firstName: form.firstName || "",
        lastName: form.lastName || "",
        streetName: form.streetName || form.address || "",
        streetNumber: form.streetNumber || "",
        postalCode: form.postalCode || "",
        city: form.city || "",
        country: form.country || "GB",
        phone: form.phone || "",
        email: form.email || "",
      };
      const billingAddress = form.billingSame
        ? shippingAddress
        : {
            firstName: form.billFirstName || shippingAddress.firstName,
            lastName: form.billLastName || shippingAddress.lastName,
            streetName: form.billStreetName || shippingAddress.streetName,
            streetNumber: shippingAddress.streetNumber,
            postalCode: shippingAddress.postalCode,
            city: shippingAddress.city,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            email: shippingAddress.email,
          };

      const r = await fetch("/api/cart/update-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, shippingAddress, billingAddress }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        setError(json || `Failed to save addresses (${r.status})`);
        return;
      }
      setCart(json);
      // reload shipping methods for new address
      await handleLoadMethods();
    } catch (e) {
      setError(String(e));
    }
  }

  /**
   * Choose a shipping method (applies to cart)
   */
  async function chooseMethod(id) {
    if (!cart?.id) {
      setError('No cart available');
      return;
    }
    setError(null);
    try {
      const r = await fetch("/api/cart/set-shipping-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, shippingMethodId: id }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        setError(json || `Failed to set shipping method (${r.status})`);
        return;
      }
      setCart(json);
      setSelectedMethodId(id);
    } catch (e) {
      setError(String(e));
    }
  }
  // -----------------------------------------------------------------------------

  // Minimal UI
  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 20 }}>
      <h2>Checkout</h2>
      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{String(error)}</div>}
      {!cart ? (
        <div>No active cart. Add items to cart first.</div>
      ) : (
        <>
          <section style={{ marginBottom: 20 }}>
            <h3>Shipping address</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={form.firstName || ""} placeholder="First name" onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input value={form.lastName || ""} placeholder="Last name" onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input value={form.streetName || ""} placeholder="Street name" onChange={(e) => setForm({ ...form, streetName: e.target.value })} />
              <input value={form.streetNumber || ""} placeholder="Street number" onChange={(e) => setForm({ ...form, streetNumber: e.target.value })} />
              <input value={form.postalCode || ""} placeholder="Postal code" onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              <input value={form.city || ""} placeholder="City" onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input value={form.country || "GB"} placeholder="Country" onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <input value={form.phone || ""} placeholder="Phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input value={form.email || ""} placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label>
                <input type="checkbox" checked={form.billingSame || false} onChange={(e) => setForm({ ...form, billingSame: e.target.checked })} /> Billing same as shipping
              </label>
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={saveAddresses} disabled={loading}>
                {loading ? "Saving…" : "Save addresses"}
              </button>
            </div>
          </section>

          <section style={{ marginBottom: 20 }}>
            <h3>Shipping methods</h3>
            {methods.length === 0 ? (
              <div>No shipping methods available. Save a valid shipping address first.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {methods.map((m) => (
                  <li key={m.id} style={{ marginBottom: 8, border: selectedMethodId === m.id ? "1px solid #0d2340" : "1px solid #ddd", padding: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{m.description || m.zoneRates?.map(z=>z.shippingRates?.map(r=>r.price?.centAmount).join(",")).join(",")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ marginBottom: 6 }}>{m?.shippingRates ? "Price: see zoneRates" : ""}</div>
                        <button onClick={() => chooseMethod(m.id)} disabled={loading || selectedMethodId === m.id}>
                          {selectedMethodId === m.id ? "Selected" : "Choose"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Totals</h3>
            {renderTotals(cart)}
          </section>
        </>
      )}
    </div>
  );
}
