import React, { useState } from "react";
import styles from './ForgotPassword.module.css'; 
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Check your email for reset instructions.");
        setEmail("");
      } else {
        alert(data.error || "Email not found.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Try again later.");
    }
  };
  
  return (
    <div className={styles.forgotPassword}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Forgot Password</h1>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Enter your registered email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>
            
            <button type="submit" className={styles.submitBtn}>
              Send Reset Link
            </button>
          </form>
          
          <div className={styles.links}>
            <Link to="/login">Back to Login</Link>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
