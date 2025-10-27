import { useEffect, useState } from "react";
import { login } from "../services/api";
import Register from "./Register";
import "./Login.css"; // ⬅️ Import the CSS
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" }); 
  const [showRegister, setShowRegister] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const username = new URLSearchParams(window.location.search).get("username");

    if (token) {
      localStorage.setItem("token", token);
      alert(`Welcome, ${username || "GitHub User"}`);
      onLogin();
    }
  }, [onLogin]);

  const validate = () => {
    const newErrors = {};
    if (!form.email.includes("@")) newErrors.email = "Invalid email address.";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const res = await login(form);
      if (res?.error) {
        alert(res.error);
      } else {
        alert(`Welcome, ${res.username}`);
        localStorage.setItem("token", res.token);
        onLogin();
        navigate("/dashboard"); // Redirect to dashboard
      }
    }
  };

  if (showRegister) {
    return <Register onRegister={() => setShowRegister(false)} />;
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome Back!</h2>
        <p className="login-subtitle">Please login to access your account</p>

        <input
          className="login-input"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {errors.email && <p className="error-text">{errors.email}</p>}

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {errors.password && <p className="error-text">{errors.password}</p>}

        <button className="login-button" type="submit">Login</button>
      </form>
    </div>
  );
}
