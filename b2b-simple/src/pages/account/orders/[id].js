// pages/account/orders/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/navbar";

const DARK_BLUE = "#0d2340";

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        // If you store a customer token, you could pass it as Authorization here – not required though:
        const r = await fetch(`/api/orders/get?id=${encodeURIComponent(id)}`);
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j?.error || "Order not found");
        }
        const j = await r.json();
        setOrder(j);
      } catch (e) {
        setErr(e.message || "Order not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={wrap}>Loading order…</div>
      </>
    );
  }

  if (err || !order) {
    return (
      <>
        <Navbar />
        <div style={wrap}>
          <div>
            <h1 style={{ color: DARK_BLUE, marginBottom: 8 }}>Error Loading Order</h1>
            <p style={{ color: "#ef4444", marginBottom: 16 }}>{err || "Order not found"}</p>
            <button onClick={() => router.push("/")} style={btnPrimary}>Back to Home</button>
          </div>
        </div>
      </>
    );
  }

  const gross = order?.totalPrice?.centAmount || 0;
  const total = (gross / 100).toFixed(2);
  const items = order?.lineItems || [];
  const createdAt = new Date(order.createdAt).toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <>
      <Navbar />
      <div style={page}>
        <div style={{ maxWidth: 1200, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {/* LEFT: simple image gallery */}
          <div>
            <Gallery items={items} />
          </div>

          {/* RIGHT: order info */}
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: DARK_BLUE, marginBottom: 8 }}>
              Order #{order.orderNumber || order.id}
            </h1>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>Placed on {createdAt}</p>

            <div style={{ marginBottom: 16, fontSize: 22, fontWeight: 700, color: DARK_BLUE }}>
              Total: £{total}
            </div>

            <div style={panel}>
              <strong>Items</strong>
              <div style={{ marginTop: 12, maxHeight: 240, overflowY: "auto" }}>
                {items.map((it) => (
                  <div key={it.id} style={row}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Qty: {it.quantity} • SKU: {it.sku}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{it.price.formatted}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div style={panel}>
                <strong>Shipping</strong>
                <Address a={order.shippingAddress} />
              </div>
              <div style={panel}>
                <strong>Billing</strong>
                <Address a={order.billingAddress} />
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <button style={btnPrimary} onClick={() => router.push("/")}>Continue Shopping</button>
              <button style={btnSecondary} onClick={() => router.push("/account?tab=orders")}>Back to Orders</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple gallery from line item images
function Gallery({ items }) {
  const images = [];
  (items || []).forEach((it) => {
    (it.images || []).forEach((img) => {
      images.push({ url: img.url, label: it.name });
    });
  });
  if (images.length === 0) images.push({ url: null, label: "Item" });

  const [idx, setIdx] = useState(0);
  return (
    <div>
      <div style={mainImgWrap}>
        {images[idx].url ? (
          <img src={images[idx].url} alt={images[idx].label} style={{ maxWidth: "100%", maxHeight: 500, objectFit: "contain" }} />
        ) : (
          <div style={placeholder}>📦</div>
        )}
        {images.length > 1 && (
          <>
            <NavBtn onClick={() => setIdx((idx - 1 + images.length) % images.length)}>&lsaquo;</NavBtn>
            <NavBtn right onClick={() => setIdx((idx + 1) % images.length)}>&rsaquo;</NavBtn>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}>
          {images.map((im, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: 72, height: 72, borderRadius: 6,
              border: i === idx ? "2px solid #0d2340" : "2px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
              {im.url ? <img src={im.url} alt={im.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ color: "#9ca3af" }}>📦</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBtn({ children, right, onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "absolute", top: "50%", transform: "translateY(-50%)",
      [right ? "right" : "left"]: 12,
      background: "rgba(255,255,255,0.9)", border: "none", width: 40, height: 40,
      borderRadius: "50%", cursor: "pointer", fontSize: 18, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
    }}>
      {children}
    </button>
  );
}

function Address({ a }) {
  if (!a) return <p style={{ marginTop: 8 }}>—</p>;
  const lines = [
    `${a.firstName || ""} ${a.lastName || ""}`.trim(),
    [a.streetNumber, a.streetName].filter(Boolean).join(" "),
    [a.city, a.postalCode].filter(Boolean).join(", "),
    a.country
  ].filter(Boolean);
  return <p style={{ marginTop: 8, whiteSpace: "pre-line" }}>{lines.join("\n")}</p>;
}

// styles
const page = { background: "#fff", minHeight: "calc(100vh - 68px)", padding: 32, fontFamily: "'Outfit', sans-serif" };
const wrap = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 68px)", fontFamily: "'Outfit', sans-serif" };
const panel = { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 };
const row = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" };
const btnPrimary = { padding: "12px 20px", background: "#0d2340", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" };
const btnSecondary = { padding: "12px 20px", background: "#fff", color: "#0d2340", border: "2px solid #d7e9f7", borderRadius: 6, fontWeight: 700, cursor: "pointer" };
const mainImgWrap = { position: "relative", background: "#f5f5f5", borderRadius: 8, height: 500, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
const placeholder = { fontSize: 64, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" };
