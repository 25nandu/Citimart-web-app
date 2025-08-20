import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./OfferProducts.module.css";

const OfferProducts = () => {
  const { offerId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/offers/${offerId}/products`) 
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offerId]);

  const getImageUrl = (image) => {
    if (!image) return "/images/default-placeholder.png";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  return (
    <div className={styles.offerProducts}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>🎁 Offer Products</h1>

        {loading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : products.length === 0 ? (
          <p className={styles.noProducts}>No products found for this offer.</p>
        ) : (
          <div className={styles.productGrid}>
            {products.map((p) => (
              <Link key={p._id} to={`/products/${p._id}`} className={styles.productCard}>
                <div className={styles.imageWrapper}>
                  <img src={getImageUrl(p.images?.[0])} alt={p.name} />
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <p className={styles.productPrice}>₹{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferProducts;
