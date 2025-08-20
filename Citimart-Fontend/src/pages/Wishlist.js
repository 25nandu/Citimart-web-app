import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Wishlist.module.css';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');

  //  Redirect if not logged in
  useEffect(() => {
    if (!customerId || !token) {
      navigate('/login');
    }
  }, [customerId, token, navigate]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`https://citimart-backend.onrender.com/api/customer/wishlist/<customerId>
`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        // Token invalid or expired → redirect
        localStorage.removeItem('customer_id');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await res.json();
      if (data.items) {
        setWishlist(data.items);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  const removeFromWishlist = async (productId, size) => {
    try {
      const res = await fetch(`http://localhost:5000/customer/wishlist/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, size }),
      });
      if (res.ok) {
        fetchWishlist();
      }
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  const moveToCart = async (productId, size) => {
    try {
      await fetch('http://localhost:5000/customer/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          size,
          quantity: 1,
        }),
      });

      await removeFromWishlist(productId, size);
    } catch (err) {
      console.error('Failed to move to cart', err);
    }
  };

  useEffect(() => {
    if (customerId && token) {
      fetchWishlist();
    }
  }, [customerId, token]);

  if (!customerId || !token) {
    return null; 
  }

  if (wishlist.length === 0) {
    return (
      <div className={styles.emptyWishlistContainer}>
        <div className={styles.emptyEmoji}>💔</div>
        <h3>Your wishlist is empty</h3>
        <a href="/products" className={styles.shopLink}>🛒 Start Shopping</a>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.wishlistMain}>
        <h2 className={styles.wishlistTitle}>❤️ Your Wishlist</h2>
        <div className={styles.wishlistList}>
          {wishlist.map((item, idx) => (
            <div key={idx} className={styles.wishlistItem}>
              <img
                src={item.product?.images?.[0] || '/images/logo.png'}
                alt={item.product?.name}
                className={styles.productImg}
              />
              <div className={styles.productInfo}>
                <a href={`/product/${item.product?._id}`} className={styles.productName}>
                  {item.product?.name}
                </a>
                <div className={styles.productPrice}>₹{item.product?.price}</div>
                <div>Size: {item.size}</div>
                <div className={styles.actions}>
                  <button className={styles.moveBtn} onClick={() => moveToCart(item.product?._id, item.size)}>
                    ➕ Move to Cart
                  </button>
                  <button className={styles.removeBtn} onClick={() => removeFromWishlist(item.product?._id, item.size)}>
                    ❌ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
