// components/OrdersContent.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { COLORS } from "../account";

export default function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        // You only store `customer` (no token). That's fine — we'll pass the id.
        const stored = localStorage.getItem("customer");
        const customer = stored ? JSON.parse(stored) : null;
        const customerId = customer?.id || "";

        const r = await fetch(
          customerId
            ? `/api/orders/list?customerId=${encodeURIComponent(customerId)}`
            : `/api/orders/list`
        );

        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || "Failed to load orders");
        setOrders(Array.isArray(j.results) ? j.results : []);
      } catch (e) {
        setError(e.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const formatOrderStatus = (orderState) => {
    const statusMap = {
      Open: { label: "Processing", color: COLORS.BABY_BLUE, emoji: "⏳" },
      Complete: { label: "Delivered", color: "#10b981", emoji: "✅" },
      Confirmed: { label: "Confirmed", color: "#3b82f6", emoji: "📋" },
      Cancelled: { label: "Cancelled", color: COLORS.SECONDARY, emoji: "❌" },
    };
    return (
      statusMap[orderState] || {
        label: orderState || "—",
        color: "#6b7280",
        emoji: "📦",
      }
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: COLORS.DARK_BLUE,
          marginBottom: "24px",
        }}
      >
        Your Orders
      </h1>

      {loading && <p>Loading orders…</p>}
      {error && !loading && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p style={{ color: "#4B5563" }}>You have no orders to display.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt);
          const total = (order.totalPrice?.centAmount || 0) / 100;
          const itemCount =
            order.lineItems?.reduce((sum, it) => sum + (it.quantity || 0), 0) ||
            0;
          const status = formatOrderStatus(order.orderState);

          return (
            <div
              key={order.id}
              style={{
                backgroundColor: "#ffffff",
                border: `1px solid ${COLORS.BABY_BLUE}`,
                borderRadius: "12px",
                boxShadow: "0 1px 4px rgba(13, 35, 64, 0.05)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "box-shadow 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(13, 35, 64, 0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 1px 4px rgba(13, 35, 64, 0.05)")
              }
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: COLORS.DARK_BLUE,
                    marginBottom: "6px",
                  }}
                >
                  Order #{order.orderNumber || order.id.slice(-8)}
                </h2>
                <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: 4 }}>
                  {orderDate.toLocaleDateString("en-GB")}
                </p>
                <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: 4 }}>
                  {itemCount} item(s)
                </p>

                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: COLORS.DARK_BLUE,
                    marginTop: "12px",
                  }}
                >
                  £{total.toFixed(2)}
                </p>

                <div
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: status.color,
                    color: "#0a0a0a",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>{status.emoji}</span>
                  <span>{status.label}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => router.push(`/account/orders/${order.id}`)}
                  style={{
                    fontSize: "14px",
                    backgroundColor: COLORS.BABY_BLUE,
                    color: COLORS.DARK_BLUE,
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontFamily: "Outfit",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
