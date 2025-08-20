import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; 

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [offers, setOffers] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCartItems(data.items || []);
      calculateTotal(data.items || []);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const fetchOffersOrSimilar = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/offers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.offers?.length > 0) {
        setOffers(data.offers);
      } else {
        const simRes = await fetch(`http://localhost:5000/customer/cart/similar/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const simData = await simRes.json();
        setSimilarProducts(simData.similar_products || []);
      }
    } catch (err) {
      console.error("Error fetching offers/similar products:", err);
    }
  };

  // Fetch wishlist products IDs (you can adjust endpoint as needed)
  const fetchWishlist = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/wishlist/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWishlist(data.product_ids || []);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const calculateTotal = (items) => {
    let t = 0, count = 0;
    for (const item of items) {
      const price = item.product?.price || 0;
      t += price * item.quantity;
      count += item.quantity;
    }
    setTotal(t);
    setTotalItems(count);
  };

  const updateQuantity = async (productId, size, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const res = await fetch('http://localhost:5000/customer/cart/update_quantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          size,
          quantity: newQuantity,
        }),
      });
      if (res.ok) fetchCart();
      else alert((await res.json()).error);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeFromCart = async (productId, size) => {
    try {
      const res = await fetch('http://localhost:5000/customer/cart/remove_item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          size,
        }),
      });
      if (res.ok) fetchCart();
      else alert((await res.json()).error);
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const clearCart = async () => {
    try {
      await fetch(`http://localhost:5000/customer/cart/clear/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
      setTotal(0);
      setTotalItems(0);
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const handleBuy = () => navigate('/checkout');

  const getImage = (item) => {
    const img = item.product?.images?.[0];
    if (!img) return '/images/logo.png';
    return img.startsWith('http') ? img : `http://localhost:5000${img}`;
  };

  const addToCart = async (productId) => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          product_id: productId,
          quantity: 1,
          size: 'M', // Default or infer from product
        }),
      });
      if (res.ok) fetchCart();
      else alert((await res.json()).error);
    } catch (err) {
      console.error("Error adding item to cart:", err);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      const res = await fetch('http://localhost:5000/customer/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_id: customerId, product_id: productId }),
      });
      if (res.ok) setWishlist(prev => [...prev, productId]);
      else alert((await res.json()).error);
    } catch (err) {
      console.error("Error adding to wishlist:", err);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const res = await fetch('http://localhost:5000/customer/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_id: customerId, product_id: productId }),
      });
      if (res.ok) setWishlist(prev => prev.filter(id => id !== productId));
      else alert((await res.json()).error);
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };
  
  
  useEffect(() => {
    fetchCart();
    fetchOffersOrSimilar();
    fetchWishlist();

    setTimeout(() => {
      console.log("Cart Items (debug):", cartItems);
    }, 1000);
  }, []);

  const discountedTotal = total > 2000 ? total - 100 : total;
  const deliveryFee = discountedTotal > 500 ? 0 : 50;
  const finalTotal = discountedTotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
          alt="Empty Cart"
          className={styles.emptyCartImg}
        />
        <h2>Your cart is empty</h2>
        <Link to="/products" className={styles.shopLink}>Go Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.cartPage}>
        <div className={styles.cartMain}>
          <h2 className={styles.cartTitle}>🛒 Shopping Cart</h2>
          <div className={styles.cartList}>
            {cartItems.map((item, idx) => (
              <div className={styles.cartItem} key={idx}>
               <Link to={`/products/${item.product?._id}`}>
              <img src={getImage(item)} alt={item.product?.name} className={styles.productImg} />
               </Link>

                <div className={styles.itemDetails}>
                  <Link to={`/products/${item.product?._id}`} className={styles.itemName}>
                    {item.product?.name}
                  </Link>
                  <div className={styles.itemSize}>Size: {item.size}</div>
                  <div className={styles.itemPrice}>Price: ₹{item.product?.price}</div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => updateQuantity(item.product?._id, item.size, item.quantity - 1)} className={styles.qtyBtn}>−</button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product?._id, item.size, item.quantity + 1)} className={styles.qtyBtn}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product?._id, item.size)} className={styles.removeBtn}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cartSummary}>
          <div className={styles.summaryBox}>
            <h3 className={styles.summaryTitle}>🧾 Order Summary</h3>

            {cartItems.map((item, idx) => (
              <div key={idx} className={styles.summaryProductRow}>
                <div className={styles.summaryProductInfo}>
                  {item.product?.name} × {item.quantity}
                </div>
                <div className={styles.summaryProductTotal}>₹{item.product?.price * item.quantity}</div>
              </div>
            ))}

            <hr className={styles.divider} />

            <div className={styles.summaryRow}>
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{total}</span>
            </div>

            {total > 2000 && (
              <div className={styles.summaryRow}>
                <span>🎉 ₹100 OFF on big order</span>
                <span className={styles.discount}>− ₹100</span>
              </div>
            )}

            <div className={styles.couponSection}>
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="🎁 Enter coupon code (e.g. NEW100)"
                className={styles.couponInput}
              />
              <button className={styles.applyBtn}>Apply</button>
            </div>

            <div className={styles.summaryRow}>
              <span>🛵 Delivery</span>
              <span className={deliveryFee === 0 ? styles.freeDelivery : styles.deliveryFee}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>

            <hr className={styles.divider} />

            <div className={styles.summaryTotal}>
              <span className={styles.totalLabel}>💰 Total</span>
              <span className={styles.totalValue}>₹{finalTotal}</span>
            </div>

            <div className={styles.actions}>
              <button onClick={handleBuy} className={styles.checkoutBtn}>✅ Place Order</button>
              <button onClick={clearCart} className={styles.clearBtn}>🧹 Clear Cart</button>
            </div>

            <div className={styles.offerNote}>
              ✨ Use coupon <strong>NEW100</strong> to get extra ₹50 OFF on ₹999+
            </div>
          </div>
        </div>
      </div>

       {cartItems.some(item => item.product?.pairs_with_products?.length > 0) && (
  <div className={styles.similarFullWidth}>
    <h3>🧩 Pair It Up With</h3>
    <div className={styles.productGrid}>
      {cartItems.flatMap(item =>
        (item.product?.pairs_with_products || []).map(pair => {
          const productId = pair._id;
          const isInWishlist = wishlist.includes(productId);
          return (
            <div key={productId} className={styles.similarCard}>
              <Link to={`/products/${productId}`}>
            <img src={pair.image || '/images/logo.png'} alt={pair.name} className={styles.pairsWithImg} />
            </Link>
          <Link to={`/products/${productId}`}>
             <h4>{pair.name}</h4>
           </Link>

              {pair.discount > 0 ? (
                <p><del>₹{pair.price}</del> <strong>₹{pair.final_price}</strong></p>
              ) : (
                <p>₹{pair.price}</p>
              )}
              <div className={styles.similarActions}>
               <button onClick={() => addToCart(productId)}>Add to Cart</button>

                <button
                  className={styles.wishlistBtn}
                  onClick={() => isInWishlist ? removeFromWishlist(productId) : addToWishlist(productId)}
                >
                  {isInWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
)}


      {/* OFFERS OR SIMILAR PRODUCTS - with Add to Cart + Wishlist buttons */}
      {(offers.length > 0 || similarProducts.length > 0) && (
        <div className={styles.similarFullWidth}>
          <h3>{offers.length > 0 ? '🔥 Offers Just for You' : '🛍️ You May Also Like'}</h3>
          <div className={styles.productGrid}>
            {(offers.length > 0 ? offers : similarProducts).map((item) => {
              const productId = item._id || item.product_id;
              const isInWishlist = wishlist.includes(productId);
              return (
                <div key={productId} className={styles.similarCard}>
                   <Link to={`/products/${productId}`}>
             <img src={item.image || item.images?.[0] || '/images/logo.png'} alt={item.name} />
            </Link>
           <Link to={`/products/${productId}`}>
              <h4>{item.name}</h4>
            </Link>

                  <p>
                    {item.original_price ? (
                      <>
                        <del>₹{item.original_price}</del>{' '}
                        <strong>₹{item.discounted_price}</strong>
                      </>
                    ) : (
                      <>₹{item.price}</>
                    )}
                  </p>
                  <p className={styles.brand}>{item.brand || item.offer_title}</p>

                  <div className={styles.similarActions}>
                    {cartItems.some(i => i.product?._id === productId || i.product?._id === item.product_id) ? (
                      <button onClick={() => navigate(`/product/${productId}`)}>
                        View
                      </button>
                    ) : (
                      <button onClick={() => addToCart(productId)}>
                        Add to Cart
                      </button>
                    )}
                    <button
                      className={styles.wishlistBtn}
                      onClick={() =>
                        isInWishlist ? removeFromWishlist(productId) : addToWishlist(productId)
                      }
                      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isInWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
