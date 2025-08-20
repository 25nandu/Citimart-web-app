import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './CheckoutPage.module.css';

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCart();
    fetchCustomerInfo();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setCartItems(data.items || []);
      calculateTotal(data.items || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const fetchCustomerInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/profile/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCustomerInfo(data);
        setPhone(data.phone || '');
      } else {
        console.error("Failed to fetch profile:", data.message);
      }
    } catch (err) {
      console.error('Error fetching customer info:', err);
    }
  };

  const calculateTotal = (items) => {
    let t = 0;
    for (const item of items) {
      t += (item.product?.price || 0) * item.quantity;
    }
    setTotal(t);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) return alert("Please enter delivery address");
    if (!phone.trim()) return alert("Please enter your phone number");

    try {
      const res = await fetch('http://localhost:5000/customer/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          address,
          phone,
          payment_method: paymentMethod,
          items: cartItems.map(item => ({
    ...item,
    quantity: Number(item.quantity) // ✅ force number type
  }))
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`${data.message}\nFinal Amount: ₹${data.final}`);
        navigate('/order-success', {
          state: {
            total: data.total,
            discount: data.discount,
            final: data.final,
          },
        });
      } else {
        alert(data.message || "Checkout failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className={styles.checkoutPage}>
      <h2 className={styles.title}>🛍️ Checkout</h2>

      <div className={styles.checkoutContainer}>
        <div className={styles.left}>
          <h3>Customer Info</h3>
          {customerInfo ? (
            <div className={styles.customerDetails}>
              <p><strong>Name:</strong> {customerInfo.fullName}</p>
              <p><strong>Email:</strong> {customerInfo.email}</p>
              <div className={styles.formGroup}>
                <label><strong><h3>Phone Number:</h3></strong></label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.phoneInput}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          ) : (
            <p>Loading customer details...</p>
          )}
         <br/>
          <h3>Shipping Address</h3>
          <textarea
            className={styles.addressInput}
            placeholder="Enter your delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
          />

          <h3>Payment Method</h3>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.paymentSelect}
          >
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
            <option value="card">Credit/Debit Card</option>
          </select>

          <button className={styles.placeOrderBtn} onClick={handlePlaceOrder}>
            ✅ Place Order
          </button>
        </div>

        <div className={styles.right}>
          <h3>Order Summary</h3>
          <ul className={styles.itemList}>
            {cartItems.map((item, idx) => (
              <li key={idx} className={styles.summaryItem}>
                {/* Clickable Image */}
                <Link to={`/products/${item.product?._id}`}>
                  <img
                    src={
                      item.product?.images?.[0]
                        ? item.product.images[0].startsWith('http')
                          ? item.product.images[0]
                          : `http://localhost:5000/${item.product.images[0]}`
                        : '/images/logo.png'
                    }
                    alt={item.product?.name || ''}
                    className={styles.itemImage}
                  />
                </Link>

                <div className={styles.itemDetails}>
                  {/* Clickable Product Name */}
                  <Link
                    to={`/product/${item.product?._id}`}
                    className={styles.itemNameLink}
                  >
                    <p>{item.product?.name}</p>
                  </Link>
                  <small>Size: {item.size} | Qty: {item.quantity}</small>
                  <div>₹{item.product?.price} × {item.quantity}</div>
                </div>
              </li>
            ))}
          </ul>

          <hr />
          <div className={styles.totalRow}>
            <span>Total:</span>
            <strong>₹{total}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
