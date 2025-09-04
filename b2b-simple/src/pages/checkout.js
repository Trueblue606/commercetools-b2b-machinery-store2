// src/pages/checkout.js - Dynamic Shipping Methods + Prefill + Place Order
import { useEffect, useState, useCallback } from "react";
import { useCart } from "./contexts/CartContext";
import Navbar from "@/components/navbar";
import { useRouter } from "next/router";

export default function Checkout() {
  const router = useRouter();
  const {
    cart,
    loading,
    selectedLineItems,
    selectedItemCount,
    customer,
    clearCart,
    setCart,
  } = useCart();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetName: "",
    streetNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "GB",
    orderNotes: "",
    billingSame: true,
  });

  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  // Shipping methods fetched from CT
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Derived totals
  const items = Array.isArray(selectedLineItems) ? selectedLineItems : [];
  const subtotalCents = items.reduce(
    (sum, item) => sum + getItemCentAmount(item),
    0
  );
  const subtotal = subtotalCents / 100;
  const freeShipping = subtotal >= 500;

  const canPlaceOrder =
    !!cart?.id &&
    items.length > 0 &&
    !!form.firstName &&
    !!form.lastName &&
    !!form.email &&
    !!form.streetName &&
    !!form.city &&
    !!form.postalCode &&
    !!form.country &&
    !!selectedMethod;

  // --- Place Order handler ---
const handlePlaceOrder = useCallback(async () => {
  setPlacing(true);
  setError(null);
  try {
    const shippingAddress = {
      firstName: form.firstName,
      lastName: form.lastName,
      streetName: form.streetName || form.address || "",
      streetNumber: form.streetNumber || "",
      postalCode: form.postalCode || "",
      city: form.city || "",
      country: form.country || "GB",
      phone: form.phone || "",
      email: form.email || "",
    };
    const billingAddress = form.billingSame ? shippingAddress : shippingAddress; // adjust if you add a real billing form

    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartId: cart?.id,
        shippingAddress,
        billingAddress,
        customerEmail: form.email,
        orderNotes: form.orderNotes,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || json?.message || "Order failed");
    }

    // persist locally for immediate display on success page
    localStorage.setItem("lastOrder", JSON.stringify(json));

    // clear the client cart
    clearCart?.();

    // robustly extract an order id and include it in the redirect
    const orderId =
      json?.id ||
      json?.order?.id ||
      json?.body?.id ||
      json?.resource?.id ||
      null;

    // push to success (with orderId when available)
    await router.push(
      orderId ? `/order-success?orderId=${encodeURIComponent(orderId)}` : "/order-success"
    );
  } catch (err) {
    setError(err?.message || "Order failed");
  } finally {
    setPlacing(false);
  }
}, [cart?.id, form, clearCart, router]);

  // Prefill from logged-in customer
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
      }));
    }
  }, [customer]);

  // Prefill from CT cart
  useEffect(() => {
    if (!cart) return;
    const sa = cart.shippingAddress || {};
    const ba = cart.billingAddress || {};
    setForm({
      firstName: sa.firstName || "",
      lastName: sa.lastName || "",
      email: sa.email || "",
      phone: sa.phone || "",
      streetName: sa.streetName || "",
      streetNumber: sa.streetNumber || "",
      address: sa.streetName || "",
      city: sa.city || "",
      postalCode: sa.postalCode || sa.postal || "",
      country: sa.country || "GB",
      orderNotes: "",
      billingSame: !ba || JSON.stringify(ba) === JSON.stringify(sa),
    });
  }, [cart?.id]);

  // Redirect if no items selected (skip while placing an order)
  useEffect(() => {
    if (!loading && !placing && selectedItemCount === 0) {
      router.push("/cart");
    }
  }, [loading, placing, selectedItemCount, router]);

  // Fetch shipping methods when cart changes
  useEffect(() => {
    async function loadMethods() {
      if (!cart?.id) {
        setMethods([]);
        return;
      }
      try {
        const r = await fetch(
          `/api/cart/shipping-methods?cartId=${encodeURIComponent(cart.id)}`
        );
        const j = await r.json();
        if (!r.ok) throw new Error(j?.message || "Failed to load methods");
        setMethods(j || []);
      } catch (e) {
        setError(String(e));
        setMethods([]);
      }
    }
    loadMethods();
  }, [cart?.id]);

  // --- Choose shipping method (updates CT cart) ---
  async function chooseMethod(method) {
    if (!cart?.id) return;
    try {
      const res = await fetch("/api/cart/set-shipping-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart.id,
          shippingMethodId: method.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to set method");
      setCart(json);
      setSelectedMethod(method);
    } catch (e) {
      setError(String(e));
    }
  }

  // Helpers
  function getItemCentAmount(item) {
    if (!item) return 0;
    const total =
      item.totalPrice?.centAmount ?? item.totalPrice?.value?.centAmount;
    if (typeof total === "number") return total;
    const unit =
      item.price?.value?.centAmount ?? item.price?.centAmount ?? 0;
    const qty = item.quantity ?? 1;
    return unit * qty;
  }

  function Field({ label, value, onChange, type = "text" }) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#0d2340" }}>
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            marginTop: 4,
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>
    );
  }

  // UI
  return (
    <>
      <Navbar />
      <div
        style={{
          maxWidth: 800,
          margin: "32px auto",
          padding: "24px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginBottom: 20,
            color: "#0d2340",
            borderBottom: "2px solid #77B6EA",
            paddingBottom: 8,
          }}
        >
          Checkout
        </h2>

        {error && (
          <div
            style={{
              background: "#cf2e2e",
              color: "white",
              padding: "10px 14px",
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            {String(error)}
          </div>
        )}

        {!cart ? (
          <div>No active cart. Add items first.</div>
        ) : (
          <>
            {/* Shipping address */}
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#0d2340", marginBottom: 12 }}>
                Shipping Address
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field
                  label="First Name"
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                />
                <Field
                  label="Last Name"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                />
                <Field
                  label="Street Name"
                  value={form.streetName}
                  onChange={(v) => setForm({ ...form, streetName: v })}
                />
                <Field
                  label="Street Number"
                  value={form.streetNumber}
                  onChange={(v) => setForm({ ...form, streetNumber: v })}
                />
                <Field
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={(v) => setForm({ ...form, postalCode: v })}
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => setForm({ ...form, country: v })}
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.billingSame}
                    onChange={(e) =>
                      setForm({ ...form, billingSame: e.target.checked })
                    }
                  />{" "}
                  Billing same as shipping
                </label>
              </div>
            </section>

            {/* Shipping methods */}
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#0d2340", marginBottom: 12 }}>
                Shipping Method
              </h3>
              {methods.length === 0 ? (
                <div>No shipping methods available.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {methods.map((m) => {
                    // Each shipping method may have zoneRates with shippingRates
                    const rate = m.zoneRates?.[0]?.shippingRates?.[0];
                    const cost = rate?.price?.centAmount || 0;
                    const priceLabel = freeShipping
                      ? "Free"
                      : `£${(cost / 100).toFixed(2)}`;
                    return (
                      <li
                        key={m.id}
                        style={{
                          marginBottom: 12,
                          border:
                            selectedMethod?.id === m.id
                              ? "2px solid #0d2340"
                              : "1px solid #ccc",
                          borderRadius: 6,
                          padding: "12px 16px",
                          background:
                            selectedMethod?.id === m.id ? "#E6F4FA" : "#fff",
                          cursor: "pointer",
                        }}
                        onClick={() => chooseMethod(m)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#0d2340" }}>
                            {m.name}
                          </span>
                          <span>{priceLabel}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Totals */}
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#0d2340", marginBottom: 12 }}>Totals</h3>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0d2340" }}>
                Subtotal: £{subtotal.toFixed(2)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0d2340" }}>
                Shipping:{" "}
                {freeShipping
                  ? "Free"
                  : selectedMethod
                  ? `£${(
                      (selectedMethod.zoneRates?.[0]?.shippingRates?.[0]?.price
                        ?.centAmount || 0) / 100
                    ).toFixed(2)}`
                  : "—"}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 6,
                  color: "#0d2340",
                }}
              >
                Total: £
                {(
                  subtotal +
                  (freeShipping
                    ? 0
                    : (selectedMethod?.zoneRates?.[0]?.shippingRates?.[0]?.price
                        ?.centAmount || 0) / 100)
                ).toFixed(2)}
              </div>
            </section>

            {/* Place order */}
            <div style={{ textAlign: "right" }}>
              <button
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || placing}
                style={{
                  background: "#0d2340",
                  color: "white",
                  padding: "12px 20px",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor:
                    !canPlaceOrder || placing ? "not-allowed" : "pointer",
                  opacity: !canPlaceOrder ? 0.6 : 1,
                }}
              >
                {placing ? "Placing order…" : "Place Order"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
