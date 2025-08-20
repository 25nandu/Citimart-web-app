import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./AdminOffers.module.css";

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    type: "popup",
    min_purchase: "",
    eligible_users: "all",
    personalized_for: "",
    start_date: "",
    end_date: "",
    products: [],
    image: null,
  });

  // ✅ Fetch offers
  const fetchOffers = () => {
    fetch("http://localhost:5000/api/offers/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch(() => setOffers([]));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // ✅ Fetch products for dropdown
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else if (Array.isArray(data.products)) setProducts(data.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]));
  }, []);

  const openModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description,
        discount: offer.discount,
        type: offer.type,
        min_purchase: offer.min_purchase || "",
        eligible_users: offer.eligible_users || "all",
        personalized_for: offer.personalized_for || "",
        start_date: offer.start_date?.slice(0, 10),
        end_date: offer.end_date?.slice(0, 10),
        products: offer.products?.map((p) => p._id) || [],
        image: null,
      });
    } else {
      setEditingOffer(null);
      setFormData({
        title: "",
        description: "",
        discount: "",
        type: "popup",
        min_purchase: "",
        eligible_users: "all",
        personalized_for: "",
        start_date: "",
        end_date: "",
        products: [],
        image: null,
      });
    }
    setModalOpen(true);
  };

  // ✅ Save Offer
  const handleSave = async () => {
    try {
      const method = editingOffer ? "PUT" : "POST";
      const url = editingOffer
        ? `http://localhost:5000/api/offers/${editingOffer._id}`
        : "http://localhost:5000/api/offers";

      const dataToSend = new FormData();
      for (const key in formData) {
        if (key === "products") {
          formData.products.forEach((p) => dataToSend.append("products[]", p));
        } else if (key === "image" && formData.image) {
          dataToSend.append("image", formData.image);
        } else {
          dataToSend.append(key, formData[key]);
        }
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: dataToSend,
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { message: "Server error" };
      }

      if (!res.ok || data.success === false) {
        alert(`❌ Failed to save offer: ${data.message || data.error || "Unknown error"}`);
        return;
      }

      alert("✅ Offer saved successfully!");
      setModalOpen(false);
      fetchOffers(); // 🔹 Reload offers after save
    } catch (err) {
      alert("❌ Something went wrong while saving offer");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/offers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        alert(`❌ Failed to delete offer: ${data.message || "Unknown error"}`);
        return;
      }

      alert("✅ Offer deleted successfully!");
      fetchOffers(); // 🔹 Reload after delete
    } catch (err) {
      alert("❌ Error deleting offer");
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎁 Manage Offers</h1>

      <button className={`${styles.btn} ${styles.btnAdd}`} onClick={() => openModal()}>
        ➕ Add Offer
      </button>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Discount</th>
            <th>Type</th>
            <th>Min Purchase</th>
            <th>Eligible Users</th>
            <th>Status</th>
            <th>Valid From</th>
            <th>Valid Till</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer._id}>
              <td>{offer.title}</td>
              <td>{offer.discount}%</td>
              <td>{offer.type}</td>
              <td>{offer.min_purchase || "-"}</td>
              <td>{offer.eligible_users || "all"}</td>
              <td>{offer.status}</td>
              <td>{offer.start_date?.slice(0, 10)}</td>
              <td>{offer.end_date?.slice(0, 10)}</td>
              <td>
                <button
                  className={`${styles.btn} ${styles.btnEdit}`}
                  onClick={() => openModal(offer)}
                >
                  ✏ Edit
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDelete}`}
                  onClick={() => handleDelete(offer._id)}
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Modal */}
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <div className={styles.modalContent}>
          <h2>{editingOffer ? "Edit Offer" : "Add Offer"}</h2>

          {/* 🔹 Title */}
          <div className={styles.inputGroup}>
            <label>Title:</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* 🔹 Description */}
          <div className={styles.inputGroup}>
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* 🔹 Image Upload */}
          <div className={styles.inputGroup}>
            <label>Offer Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            />
          </div>

          {/* 🔹 Product Selection */}
          <div className={styles.inputGroup}>
            <label>Select Products:</label>
            <select
              multiple
              value={formData.products}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  products: Array.from(e.target.selectedOptions, (opt) => opt.value),
                })
              }
            >
              {products.length > 0 ? (
                products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option disabled>No Products Available</option>
              )}
            </select>
          </div>

          {/* 🔹 Discount */}
          <div className={styles.inputGroup}>
            <label>Discount (%):</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Offer Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="popup">Popup</option>
              <option value="deal">Deal of the Day</option>
              <option value="bogo">Buy 1 Get 1</option>
              <option value="free_shipping">Free Shipping</option>
              <option value="flat">Flat Discount</option>
              <option value="percent">Percentage Discount</option>
              <option value="predefined">Festival/Seasonal Sale</option>
              <option value="referral">Referral Reward</option>
              <option value="personalized">Personalized Offer</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Min Purchase (₹):</label>
            <input
              type="number"
              value={formData.min_purchase}
              onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Eligible Users:</label>
            <select
              value={formData.eligible_users}
              onChange={(e) => setFormData({ ...formData, eligible_users: e.target.value })}
            >
              <option value="all">All</option>
              <option value="army">Army</option>
              <option value="navy">Navy</option>
              <option value="airforce">Airforce</option>
              <option value="loyal">Loyal Customers</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Personalized For (Email):</label>
            <input
              type="email"
              value={formData.personalized_for}
              onChange={(e) => setFormData({ ...formData, personalized_for: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Valid From:</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Valid Till:</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className={styles.modalButtons}>
            <button className={`${styles.btn} ${styles.btnSave}`} onClick={handleSave}>
              💾 Save
            </button>
            <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setModalOpen(false)}>
              ❌ Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOffers;
