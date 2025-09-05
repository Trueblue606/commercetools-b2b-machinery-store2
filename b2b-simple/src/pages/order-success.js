// pages/order-success.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";

const DARK_BLUE = "#0d2340";
const BABY_BLUE = "#d7e9f7";

export default function OrderSuccess() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("orderId");

        const savedOrder = localStorage.getItem("lastOrder");
        if (savedOrder) {
          const parsed = JSON.parse(savedOrder);
          if (parsed?.id) setOrderData(parsed);
          localStorage.removeItem("lastOrder");
          localStorage.removeItem("selected_items");
        } else if (orderId) {
          const res = await fetch(`/api/order/get?id=${orderId}`);
          if (res.ok) {
            const json = await res.json();
            setOrderData(json);
          }
        }
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, []);

  if (loading) return <Spinner />;

  if (!orderData) {
    return (
      <>
        <Navbar />
        <div style={pageWrap}>
          <h2>No Order Found</h2>
          <Link href="/">Back to Home</Link>
        </div>
      </>
    );
  }

  const gross = orderData.totalPrice?.centAmount || 0;
  const total = (gross / 100).toFixed(2);
  const lineItems = orderData.lineItems || [];
  const shipping = orderData.shippingAddress || {};
  const billing = orderData.billingAddress || {};

  return (
    <>
     
      <div style={pageWrap}>
        <div style={card}>
          <h1 style={heading}>Order Confirmed!</h1>
          <p style={{ marginBottom: 20 }}>
            Thank you for your order{" "}
            <strong>{orderData.customerEmail}</strong>
          </p>

          <h3 style={subHeading}>Order Info</h3>
          <p><strong>Order Number:</strong> {orderData.orderNumber || orderData.id}</p>
          <p><strong>Total:</strong> £{total}</p>

          <h3 style={subHeading}>Items</h3>
          <ul>
            {lineItems.map((item) => (
              <li key={item.id}>
                {item.name?.["en-GB"] || item.name?.en || item.productId} —{" "}
                Qty {item.quantity} — £
                {(item.totalPrice?.centAmount / 100).toFixed(2)}
              </li>
            ))}
          </ul>

          <h3 style={subHeading}>Shipping Address</h3>
          <AddressBlock addr={shipping} />

          <h3 style={subHeading}>Billing Address</h3>
          <AddressBlock addr={billing} />

          <div style={{ marginTop: 30 }}>
            <Link href="/" style={buttonPrimary}>
              Continue Shopping
            </Link>
            <Link href="/account?tab=orders" style={buttonSecondary}>
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <>
      <Navbar />
      <div style={pageWrap}>Loading order…</div>
    </>
  );
}

function AddressBlock({ addr }) {
  if (!addr) return <p>—</p>;
  return (
    <p>
      {addr.firstName} {addr.lastName}
      <br />
      {addr.streetNumber} {addr.streetName}
      <br />
      {addr.postalCode} {addr.city}
      <br />
      {addr.country}
      {addr.phone && <><br />{addr.phone}</>}
    </p>
  );
}

const pageWrap = {
  backgroundColor: "#fff",
  minHeight: "calc(100vh - 68px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px",
  fontFamily: "'Outfit', sans-serif",
};
const card = {
  maxWidth: "600px",
  width: "100%",
  background: "#fff",
  border: `2px solid ${BABY_BLUE}`,
  borderRadius: 12,
  padding: "32px",
};
const heading = { fontSize: "1.8rem", fontWeight: 800, color: DARK_BLUE, marginBottom: 12 };
const subHeading = { marginTop: 20, fontSize: "1.2rem", fontWeight: 700, color: DARK_BLUE };
const buttonPrimary = {
  display: "inline-block",
  marginRight: "12px",
  padding: "12px 24px",
  background: DARK_BLUE,
  color: "#fff",
  borderRadius: 8,
  fontWeight: 600,
  textDecoration: "none",
};
const buttonSecondary = {
  display: "inline-block",
  padding: "12px 24px",
  border: `2px solid ${BABY_BLUE}`,
  color: DARK_BLUE,
  borderRadius: 8,
  fontWeight: 600,
  textDecoration: "none",
};
