import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";
import "./Register.css";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);

    if (res?.error) {
      alert(res.error);
    } else {
      alert("Registered successfully!");
      onRegister();
      navigate("/dashboard"); // Redirect to dashboard
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2 className="register-title">Register</h2>

        <input
          className="register-input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="register-input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="register-button" type="submit">Register</button>

       
      </form>
    </div>
  );
}
