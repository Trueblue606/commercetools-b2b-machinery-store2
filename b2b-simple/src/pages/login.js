// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem("customer", JSON.stringify(data.customer));
        router.push("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "Error logging in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "40px",
          border: "2px solid #d7e9f7",
          borderRadius: "20px",
          backgroundColor: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>
        {error && (
          <p
            style={{
              color: "red",
              fontWeight: 600,
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "#0a0a0a",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
          }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginBottom: "16px",
  padding: "16px",
  borderRadius: "12px",
  backgroundColor: "#f8fafe",
  border: "none",
};
