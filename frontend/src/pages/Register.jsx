import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await axiosInstance.post("/api/auth/register", form);

      alert("Registration submitted successfully. Please wait for admin approval.");
      navigate("/login", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.leftOverlay}>
          <div style={styles.kicker}>CREATE ACCOUNT</div>
          <h1 style={styles.title}>Join a more elegant analytics experience</h1>
          <p style={styles.text}>
            Register to enter the CSBM Smart Analytics Engine and access structured uploads,
            previews, analysis navigation, and premium operational intelligence.
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.logo}>CSBM</div>
          <h2 style={styles.cardTitle}>Register</h2>
          <p style={styles.cardText}>
            Create your account and submit it for approval.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                style={styles.input}
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                style={styles.input}
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                style={styles.input}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? "Submitting..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div style={styles.footerText}>
            Already have an account? <Link to="/login">Login</Link> {" | "}
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    background: "#f3f2ee",
  },
  leftPanel: {
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(194,65,12,0.72)), url('/videos/hero.mp4')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px",
  },
  leftOverlay: {
    maxWidth: "560px",
    color: "#fff",
  },
  kicker: {
    fontSize: "0.9rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "14px",
    color: "#fde68a",
  },
  title: {
    margin: 0,
    fontFamily: "Georgia, serif",
    fontSize: "3rem",
    lineHeight: 1.08,
    fontWeight: 500,
  },
  text: {
    marginTop: "18px",
    lineHeight: 1.85,
    color: "rgba(255,255,255,0.9)",
  },
  rightPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #e7e5df",
    borderRadius: "28px",
    padding: "36px",
    boxShadow: "0 20px 48px rgba(15,23,42,0.08)",
  },
  logo: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    background: "#0f172a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "2rem",
    fontFamily: "Georgia, serif",
    fontWeight: 500,
  },
  cardText: {
    marginTop: "10px",
    color: "#64748b",
    lineHeight: 1.7,
  },
  form: {
    display: "grid",
    gap: "18px",
    marginTop: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d7dde5",
    outline: "none",
    boxSizing: "border-box",
  },
  primaryBtn: {
    marginTop: "6px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  footerText: {
    marginTop: "20px",
    color: "#475569",
  },
};