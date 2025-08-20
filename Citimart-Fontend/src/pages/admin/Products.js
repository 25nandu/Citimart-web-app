import React, { useEffect, useState } from 'react';
import styles from './Products.module.css';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // Fetch only admin-added products
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products/all')
      .then(res => res.json())
      .then(data => {
        const adminProducts = (data.products || []).filter(
          (p) => p.added_by === 'admin'
        );
        setProducts(adminProducts);
      })
      .catch(err => console.error('Failed to fetch products', err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}?is_admin=true`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (res.ok) {
        alert('Product deleted successfully!');
        fetchProducts(); // Refresh list
      } else {
        alert(result.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('An error occurred while deleting the product.');
    }
  };

  return (
    <div className={styles.products}>
      <div className={styles.header}>
        <h1>My Products (Admin)</h1>
        <button
          className={styles.addButton}
          onClick={() => navigate('/admin/add-product')}
        >
          + Add Product
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Image</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product._id}>
                <td>{index + 1}</td>
                <td>{product.name}</td>
                  <td>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]} // First image as thumbnail
            alt={product.name}
            className={styles.thumbnail}
          />
        ) : (
          <span>No Image</span>
        )}
      </td>
                <td>{product.category} / {product.subCategory} 
                {product.childCategory ? ` / ${product.childCategory}` : ""}</td>
                <td>₹{product.price}</td>
                <td>
                  {product.variants?.reduce(
                    (total, v) => total + parseInt(v.stock || 0), 0
                  )}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      styles[product.status?.toLowerCase()] || styles.inactive
                    }`}
                  >
                    {product.status || 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  No admin products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
