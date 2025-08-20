import React, { useEffect, useState } from 'react';
import styles from './AdminOrders.module.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchOrders();
  }, [backendURL]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${backendURL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();

      const mappedOrders = data.map(order => ({
        _id: order._id,
        order_id: order.order_id || order._id.substring(0, 8),
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        date: order.date,
        products: order.products,
        total: order.total,
        payment: order.payment,
        status: order.status,
      }));

      setOrders(mappedOrders);
      setFilteredOrders(mappedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchSearch =
        search.trim() === '' ||
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.phone.includes(search);

      const matchStatus =
        statusFilter === 'all' || order.status.toLowerCase() === statusFilter;

      return matchSearch && matchStatus;
    });

    setFilteredOrders(filtered);
  }, [search, statusFilter, orders]);

  const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
      return 'xxxxxx';
    }
    return phone.substring(0, 4) + 'xxxxxx';
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return "https://via.placeholder.com/100";
    return imgPath.replace(/\\/g, '/');
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`${backendURL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${backendURL}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchOrders(); // Refresh orders
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className={styles.orders}>
      <div className={styles.header}>
        <h1>Orders</h1>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="placed">Placed</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.order_id}</td>
                <td>{order.customer_name}</td>
                <td>{maskPhone(order.phone)}</td>
                <td>{order.address}</td>
                <td>{order.date}</td>
                <td>
                  <ul className={styles.itemList}>
                    {order.products.map((item, idx) => (
                      <li key={idx} className={styles.item}>
                        <img
                          src={getImageUrl(item.images?.[0])}
                          alt={item.name}
                          className={styles.itemImage}
                        />
                        <div>
                          <p>{item.name}</p>
                          <small>Qty: {item.qty} | Size: {item.size || "N/A"}</small>
                          <p>₹{item.price}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>₹{order.total}</td>
                <td>
                  <span className={`${styles.payment} ${styles.paid}`}>
                    {order.payment}
                  </span>
                </td>
                <td>
                  <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                    <button
                      className={styles.updateButton}
                      onClick={() => handleUpdateStatus(order._id, prompt("Enter new status:", order.status))}
                    >
                      Update
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(order._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Order Details - {selectedOrder.order_id}</h2>
            <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
            <p><strong>Phone:</strong> {selectedOrder.phone}</p>
            <p><strong>Address:</strong> {selectedOrder.address}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Total:</strong> ₹{selectedOrder.total}</p>
            <h3>Products:</h3>
            <ul>
              {selectedOrder.products.map((p, idx) => (
                <li key={idx}>
                  {p.name} - Qty: {p.qty}, Size: {p.size || "N/A"}, ₹{p.price}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedOrder(null)} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
