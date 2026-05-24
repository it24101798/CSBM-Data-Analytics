import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

      const res = await axiosInstance.post("/api/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/user-dashboard", { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.leftOverlay}>
          <div style={styles.kicker}>WELCOME BACK</div>
          <h1 style={styles.title}>Enter your premium analytics workspace</h1>
          <p style={styles.text}>
            Sign in to upload files, analyze batches, review charts, and manage data intelligence
            with a more refined platform experience.
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.logo}>CSBM</div>
          <h2 style={styles.cardTitle}>Login</h2>
          <p style={styles.cardText}>Access your account and continue your analytics journey.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
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
              {loading ? "Signing In..." : "SIGN IN"}
            </button>
          </form>

          <div style={styles.footerText}>
            Don’t have an account? <Link to="/register">Register</Link> {" | "}
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
      "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(29,78,216,0.78)), url('/videos/hero.mp4')",
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
    color: "#dbeafe",
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