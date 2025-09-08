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

  // --- Place Order handler (UI only; unchanged logic) ---
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
      const billingAddress = form.billingSame ? shippingAddress : shippingAddress; // placeholder kept

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

      localStorage.setItem("lastOrder", JSON.stringify(json));
      clearCart?.();

      const orderId =
        json?.id ||
        json?.order?.id ||
        json?.body?.id ||
        json?.resource?.id ||
        null;

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

  // === SURGICAL CHANGE: auto-select "standard" when subtotal <= 499 and nothing is chosen yet ===
  useEffect(() => {
    if (!cart?.id) return;
    if (!methods || methods.length === 0) return;

    // Respect existing selection (either local UI or cart shippingInfo from CT)
    const alreadySetId =
      selectedMethod?.id ||
      cart?.shippingInfo?.shippingMethod?.id ||
      null;
    if (alreadySetId) return;

    // Only under the free threshold; freeShipping is true when subtotal >= 500
    if (freeShipping) return;

    // Find a shipping method with key "standard"
    const standard = methods.find(
      (m) => (m.key || "").toLowerCase() === "standard"
    );
    if (!standard) return;

    // Apply default once; user can switch to premium afterwards
    chooseMethod(standard);
  }, [cart?.id, methods, freeShipping, selectedMethod]); // (intentionally not including chooseMethod)

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
        <label style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a" }}>
          {label}
        </label>
        <input
          className="chk-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: "12px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            marginTop: 6,
            outline: "none",
            fontSize: 14,
            background: "#fff",
          }}
        />
      </div>
    );
  }

  // UI
  return (
    <>
      <div
        style={{
          maxWidth: 920,
          margin: "32px auto",
          padding: "28px",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            color: "#0a0a0a",
            borderBottom: "2px solid #77B6EA",
            paddingBottom: 10,
            lineHeight: 1.2,
          }}
        >
          Checkout
        </h2>

        {error && (
          <div
            style={{
              background: "#cf2e2e",
              color: "white",
              padding: "12px 14px",
              borderRadius: 8,
              marginBottom: 18,
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
              <h3 style={{ color: "#0a0a0a", marginBottom: 14, fontSize: 18 }}>
                Shipping Address
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
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
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 14, color: "#0a0a0a" }}>
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
              <h3 style={{ color: "#0a0a0a", marginBottom: 14, fontSize: 18 }}>
                Shipping Method
              </h3>
              {methods.length === 0 ? (
                <div style={{ color: "#6b7280" }}>No shipping methods available.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {methods.map((m) => {
                    const rate = m.zoneRates?.[0]?.shippingRates?.[0];
                    const cost = rate?.price?.centAmount || 0;
                    const priceLabel = freeShipping ? "Free" : `£${(cost / 100).toFixed(2)}`;
                    const selected = selectedMethod?.id === m.id;
                    return (
                      <li
                        key={m.id}
                        className={`shipItem${selected ? " selected" : ""}`}
                        style={{
                          marginBottom: 12,
                          border: selected ? "2px solid #0a0a0a" : "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: "14px 16px",
                          background: selected ? "#F4F6F8" : "#fff",
                          cursor: "pointer",
                        }}
                        onClick={() => chooseMethod(m)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#0a0a0a" }}>
                            {m.name}
                          </span>
                          <span className="pricePill">{priceLabel}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Totals */}
            <section style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#0a0a0a", marginBottom: 12 }}>Totals</h3>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0a" }}>
                Subtotal: £{subtotal.toFixed(2)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0a0a0a" }}>
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
                  color: "#0a0a0a",
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
                className="placeBtn"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || placing}
                style={{
                  background: "#0a0a0a",
                  color: "white",
                  padding: "14px 22px",
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "1px solid #1f2937",
                  cursor: !canPlaceOrder || placing ? "not-allowed" : "pointer",
                  opacity: !canPlaceOrder ? 0.7 : 1,
                  minWidth: 180,
                }}
              >
                {placing ? "Placing order…" : "Place Order"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Scoped UI styles only */}
      <style jsx>{`
        .shipItem {
          transition: border-color .2s ease, background .2s ease, transform .06s ease;
        }
        .shipItem:hover {
          border-color: #0a0a0a;
          background: #f8fafc;
        }
        .shipItem:active {
          transform: translateY(1px);
        }
        .pricePill {
          display: inline-block;
          min-width: 64px;
          text-align: center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #0a0a0a;
          font-weight: 600;
          font-size: 14px;
        }
        .placeBtn {
          box-shadow:
            0 12px 22px rgba(0,0,0,0.20),
            inset 0 1px 0 rgba(255,255,255,0.05);
          background-image: linear-gradient(to bottom, #1f2937, #0a0a0a);
          transition: transform .06s ease, box-shadow .2s ease, background .2s ease, filter .2s ease;
        }
        .placeBtn:hover {
          background-image: linear-gradient(to bottom, #374151, #111827);
        }
        .placeBtn:active {
          background-image: linear-gradient(to bottom, #000000, #1f2937);
          transform: translateY(1px);
        }
        .placeBtn:disabled {
          background-image: linear-gradient(to bottom, #4b5563, #374151);
        }
      `}</style>

      {/* Global-ish input polish for this page only */}
      <style jsx global>{`
        .chk-input:focus {
          border-color: #0a0a0a !important;
          box-shadow: 0 0 0 3px rgba(10,10,10,0.12);
        }
      `}</style>
    </>
  );
}

