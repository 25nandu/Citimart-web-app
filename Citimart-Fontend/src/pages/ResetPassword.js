import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/auth/set-password`, {
        token,
        password
      });

      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err.response);
      if (err.response) {
        setError(err.response.data.error || "Unexpected server error.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  const clearFields = () => {
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.resetContainer}>
      <form onSubmit={handleSubmit} className={styles.resetForm}>
        <h2>Reset Password</h2>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={styles.input}
        />

        <div className={styles.options}>
          <label>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show Password
          </label>

          <button type="button" onClick={clearFields} className={styles.clearBtn}>
            Clear
          </button>
        </div>

        <button type="submit" className={styles.submitBtn}>Set New Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
