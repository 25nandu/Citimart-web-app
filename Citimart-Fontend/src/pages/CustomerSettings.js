import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import styles from './CustomerSettings.module.css';

const CustomerSettings = () => {
  const [profile, setProfile] = useState({ name: '', email: '', address: '', image: null });
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [token, setToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    const customer = JSON.parse(localStorage.getItem('customer'));
    if (customer && customer.id && customer.token) {
      setProfile({
        name: customer.name,
        email: customer.email,
        address: customer.address || '',
        image: customer.image || null,
      });
      setToken(customer.token);
      setCustomerId(customer.id);

      fetchOrders(customer.token, customer.id);
      fetchWishlist(customer.token);
    }
  }, []);

  const fetchOrders = async (token, id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/customer/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
      else console.error('Failed to load orders:', data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const fetchWishlist = async (token) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setWishlistCount(data.items?.length || 0);
      else console.error('Failed to load wishlist:', data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      formData.append('address', profile.address);
      if (profile.image) {
        formData.append('image', profile.image);
      }

      const res = await fetch('http://127.0.0.1:5000/customer/update-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert('Profile updated successfully');
        localStorage.setItem('customer', JSON.stringify({ ...profile, token, id: customerId }));
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/customer/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password changed successfully');
        setPasswords({ current: '', new: '' });
      } else {
        alert(data.error || 'Password update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error changing password');
    }
  };

  return (
    <div className={styles.settings}>
      <h2>My Dashboard</h2>

      <div className={styles.statsBox}>
      <div className={styles.statCard}>
    <h4>
      <Link to="/orders" className={styles.orderLink}>
        Total Orders
      </Link>
    </h4>
    <p>{orders.length}</p>
  </div>
  <div className={styles.statCard}>
    <h4>Wishlist Items</h4>
    <p>{wishlistCount}</p>
  </div>
    </div>
      <div className={styles.profile}>
        <h3>Update Profile</h3>
        <label>Name</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <label>Email</label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        />
        <label>Address</label>
        <textarea
          value={profile.address}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
        />
        <label>Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfile({ ...profile, image: e.target.files[0] })}
        />
        {profile.image && (
          <div className={styles.imagePreview}>
            <img
              src={URL.createObjectURL(profile.image)}
              alt="Profile Preview"
              height="100"
            />
          </div>
        )}
        <button onClick={handleProfileUpdate}>Update Profile</button>
      </div>

      <div className={styles.password}>
        <h3>Change Password</h3>
        <label>Current Password</label>
        <input
          type="password"
          value={passwords.current}
          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
        />
        <label>New Password</label>
        <input
          type="password"
          value={passwords.new}
          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
        />
        <button onClick={handleChangePassword}>Change Password</button>
      </div>

      <div className={styles.orders}>
        <h3>Order History</h3>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order, idx) => (
            <div className={styles.orderCard} key={idx}>
              <div className={styles.orderHeader}>
                <span><strong>Order ID:</strong> {order._id}</span>
                <span><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.items}>
                {order.products.map((item, i) => (
                  <div className={styles.item} key={i}>
                    <img
                      src={item.product?.images?.[0] || '/images/logo.png'}
                      alt={item.product?.name || 'Product'}
                      height={80}
                    />
                    <div>
                      <p><strong>{item.product?.name}</strong></p>
                      <p>Size: {item.size || 'N/A'}</p>
                      {item.color && <p>Color: {item.color}</p>}
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ₹{item.product?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <p><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</p>
                <p><strong>Total:</strong> ₹{order.total}</p>
                {order.discount > 0 && <p><strong>Discount:</strong> −₹{order.discount}</p>}
                <p><strong>Final Paid:</strong> ₹{order.final}</p>
                <p><strong>Status:</strong> {order.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerSettings;
