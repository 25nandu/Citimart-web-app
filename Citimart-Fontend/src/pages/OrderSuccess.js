// src/pages/OrderSuccess.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './OrderSuccess.module.css';

const OrderSuccess = () => {
  const location = useLocation();
  const { total, discount, final } = location.state || {};

  return (
    <div className={styles.successContainer}>
      <img src= "https://cdn-icons-png.flaticon.com/512/3159/3159066.png" alt="Order Success" className={styles.successImage} />
      <h2>🎉 Order Placed Successfully!</h2>
      <div className={styles.details}>
        <p><strong>Total:</strong> ₹{total}</p>
        {discount > 0 && <p><strong>Discount:</strong> −₹{discount}</p>}
        <p><strong>Final Amount Paid:</strong> ₹{final}</p>
      </div>
      <div className={styles.actions}>
        <Link to="/products" className={styles.shopBtn}>🛍️ Continue Shopping</Link>
        <Link to="/orders" className={styles.ordersBtn}>📦 View My Orders</Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
