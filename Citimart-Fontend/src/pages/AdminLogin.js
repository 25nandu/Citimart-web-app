import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://citimart-backend.onrender.com/api/auth/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "admin" }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        localStorage.setItem("name", user.fullName || user.name);
        localStorage.setItem("userId", user.id);

        toast.success("Admin logged in successfully!");
        navigate("/admin/dashboard");
      } else {
        toast.error(data.error || "Login failed!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Admin Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="submit" className={styles.submitBtn}>Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
