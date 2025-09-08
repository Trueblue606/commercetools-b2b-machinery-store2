// pages/signup.js
import { useState } from "react";
import { useRouter } from "next/router";

// Your real CT customer-group IDs
const groupMap = {
  standard:   { id: "d7a14b96-ca48-4a3f-b35d-6bce624e3b16", label: "Standard" },
  contractA:  { id: "20304c81-f448-4c7e-9231-ba55488251e5", label: "Contract A" },
  distributor:{ id: "a1aff334-3def-4937-9116-5f2f96f93214", label: "Distributor" },
  special:    { id: "68baca5b-b96b-4751-9f85-215fb1a7417c", label: "Special Project" },
  testoverlap:{ id: "fc05910d-ec00-4d7a-abaa-967d352af9fc", label: "Test Overlap" },
};

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    groupKey: "standard",
  });
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState(""); // e.g. "email"
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear field-level error as user types
    if (fieldError === name) setFieldError("");
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldError("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem("customer", JSON.stringify(data.customer));
        router.push("/");
      } else {
        const err = await resp.json().catch(() => ({}));
        setError(err.error || "Signup failed");
        if (err.field) setFieldError(err.field);
      }
    } catch (err) {
      setError(err.message || "Error signing up");
    } finally {
      setIsLoading(false);
    }
  };

  const Input = (props) => (
    <input
      {...props}
      style={{
        ...inputStyle,
        border: fieldError === props.name ? "2px solid #ef4444" : "none",
        outline: fieldError === props.name ? "none" : undefined,
      }}
    />
  );

  return (
    <div style={pageWrap}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Create Account</h2>

        {error && (
          <p style={{ color: "#ef4444", fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
            {error}
          </p>
        )}

        <Input
          type="text" name="firstName" placeholder="First Name"
          value={formData.firstName} onChange={handleChange} required
        />
        <Input
          type="text" name="lastName" placeholder="Last Name"
          value={formData.lastName} onChange={handleChange} required
        />
        <Input
          type="text" name="companyName" placeholder="Company Name"
          value={formData.companyName} onChange={handleChange} required
        />
        <Input
          type="email" name="email" placeholder="Email"
          value={formData.email} onChange={handleChange} required
        />
        <Input
          type="password" name="password" placeholder="Password"
          value={formData.password} onChange={handleChange} required
        />

        <select
          name="groupKey"
          value={formData.groupKey}
          onChange={handleChange}
          style={inputStyle}
        >
          {Object.entries(groupMap).map(([key, g]) => (
            <option key={key} value={key}>{g.label}</option>
          ))}
        </select>

        <button type="submit" disabled={isLoading} style={buttonStyle}>
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

const pageWrap = {
  backgroundColor: "#fff",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const formStyle = {
  maxWidth: 400, width: "100%",
  padding: 40, border: "2px solid #d7e9f7",
  borderRadius: 20, backgroundColor: "#fff",
};
const inputStyle = {
  width: "100%", marginBottom: 16, padding: 16,
  borderRadius: 12, backgroundColor: "#f8fafe", border: "none",
};
const buttonStyle = {
  width: "100%", padding: 16, backgroundColor: "#0a0a0a",
  color: "#fff", border: "none", borderRadius: 12, fontWeight: 700,
};
