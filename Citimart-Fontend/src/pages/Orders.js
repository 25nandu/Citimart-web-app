import React, { useEffect, useState, useRef } from 'react';
import styles from './Orders.module.css';

const Modal = ({ title, children, onClose }) => {
  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          width: '90%',
          maxWidth: 500,
          padding: 20,
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const token = localStorage.getItem('token');
  const customerId = localStorage.getItem('customer_id');
  const intervalRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/orders/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Poll every 10 seconds for updates
    intervalRef.current = setInterval(fetchOrders, 10000);

    return () => clearInterval(intervalRef.current);
  }, [customerId, token]);

  const downloadInvoice = (order) => {
    const date = new Date(order.created_at).toLocaleString();
    const filename = `Invoice_${order._id}.txt`;

    let content = `🧾 CITIMART INVOICE\n`;
    content += `Order ID: ${order._id}\nDate: ${date}\n\n`;
    content += `Items:\n`;

    order.products.forEach((item, idx) => {
      content += `  ${idx + 1}. ${item.product?.name} (Size: ${item.size}) × ${item.quantity} = ₹${item.product?.price * item.quantity}\n`;
    });

    content += `\nSubtotal: ₹${order.total}`;
    if (order.discount > 0) content += `\nDiscount: -₹${order.discount}`;
    content += `\nTotal Paid: ₹${order.final}`;
    content += `\nStatus: ${order.status}`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitReview = async () => {
    if (!reviewText.trim()) {
      alert('Please enter your review before submitting.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/customer/review/${reviewOrder._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review: reviewText }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Review submitted successfully!');
        setReviewOrder(null);
        setReviewText('');
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting review');
    }
  };

  return (
    <div className={styles.ordersPage}>
      <h2>📦 My Orders</h2>
      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <img src="/images/empty-box.png" alt="No Orders" />
            <h2>No orders found</h2>
          </div>
        ) : (
          orders.map((order, idx) => (
            <div className={styles.orderCard} key={idx}>
              <div className={styles.orderHeader}>
                <span><strong>Order ID:</strong> {order._id}</span>
                <span><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.items}>
                {order.products.map((item, index) => (
                  <div className={styles.item} key={index}>
                    <img src={item.product?.images?.[0] || '/images/logo.png'} alt="Product" />
                    <div>
                      <p><strong>{item.product?.name}</strong></p>
                      <p>Size: {item.size}</p>
                      <p>Qty: {item.quantity}</p>
                      <p>Price: ₹{item.product?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <p><strong>Total:</strong> ₹{order.total}</p>
                {order.discount > 0 && <p><strong>Discount:</strong> −₹{order.discount}</p>}
                <p><strong>Final:</strong> ₹{order.final}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <div className={styles.buttonsGroup}>
                  <button
                    className={styles.invoiceBtn}
                    onClick={() => downloadInvoice(order)}
                  >
                    🧾 Download Invoice
                  </button>
                  <button
                    className={styles.trackingBtn}
                    onClick={() => setTrackingOrder(order)}
                  >
                    🚚 Tracking
                  </button>
                  {order.status.toLowerCase() === 'delivered' && (
                  <button
                    className={styles.reviewBtn}
                    onClick={() => setReviewOrder(order)}
                  >
                    ⭐ Review
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <Modal title={`Tracking Info for Order ${trackingOrder._id}`} onClose={() => setTrackingOrder(null)}>
          <p><strong>Status:</strong> {trackingOrder.status}</p>
          <p><strong>Expected Delivery:</strong> {trackingOrder.expected_delivery || 'N/A'}</p>
          <p><strong>Courier:</strong> {trackingOrder.courier || 'N/A'}</p>
          <button onClick={() => setTrackingOrder(null)} style={{ marginTop: 10 }}>Close</button>
        </Modal>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <Modal title={`Write a Review for Order ${reviewOrder._id}`} onClose={() => setReviewOrder(null)}>
          <textarea
            rows="5"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review here..."
            style={{ width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button onClick={submitReview} style={{ marginRight: 10 }}>Submit Review</button>
          <button onClick={() => setReviewOrder(null)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
