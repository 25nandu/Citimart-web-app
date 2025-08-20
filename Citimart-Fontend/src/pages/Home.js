import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const Home = () => {
  const banners = [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1600&auto=format",
  ];

  const [currentBanner, setCurrentBanner] = useState(0);
  const [offers, setOffers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/offers")
      .then((res) => res.json())
      .then((data) => setOffers(data))
      .catch(() => setOffers([]));

    const dummyNewArrivals = [
      {
        _id: "1",
        name: "Floral Summer Dress",
        price: 999,
        images: [
          "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=400&q=80",
        ],
      },
      {
        _id: "2",
        name: "Casual Denim Jeans",
        price: 1299,
        images: [
          "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80",
        ],
      },
      {
        _id: "3",
        name: "Classic White Sneakers",
        price: 1999,
        images: [
          "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80",
        ],
      },
      {
        _id: "4",
        name: "Leather Handbag",
        price: 2599,
        images: [
          "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=400&q=80",
        ],
      },
      {
        _id: "5",
        name: "Stylish Sunglasses",
        price: 699,
        images: [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
        ],
      },
    ];
    setNewArrivals(dummyNewArrivals);
  }, []);

  const categories = [
    { id: "clothing", name: "Clothing", img: "https://picsum.photos/500/500?random=123" },
    { id: "accessories", name: "Accessories", img: "https://picsum.photos/500/500?random=78" },
    { id: "handmade", name: "Handmade", img: "https://picsum.photos/500/500?random=23" },
    {
      id: "home-decor",
      name: "Home & Decor",
      img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const brands = [
    { name: "Nike", img: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
    { name: "Adidas", img: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
    { name: "Puma", img: "https://upload.wikimedia.org/wikipedia/en/f/fd/Puma_AG.svg" },
    { name: "H&M", img: "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg" },
    { name: "Zara", img: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg" },
  ];

  const featuredProducts = [
    {
      id: 101,
      name: "Printed T-Shirt",
      price: 599,
      rating: 4.5,
      img: "https://images.unsplash.com/photo-1520975860004-2c1d0d4b8a26",
    },
    {
      id: 102,
      name: "Slim Fit Jeans",
      price: 1299,
      rating: 4.2,
      img: "https://images.unsplash.com/photo-1520974735194-3b46a6eafd4b",
    },
    {
      id: 103,
      name: "White Sneakers",
      price: 1999,
      rating: 4.8,
      img: "https://images.unsplash.com/photo-1603252109303-2751441dd157",
    },
    {
      id: 104,
      name: "Leather Handbag",
      price: 2499,
      rating: 4.6,
      img: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48",
    },
  ];

  const trendingNow = [
    { id: 201, name: "Floral Dress", price: 899, img: "https://images.unsplash.com/photo-1514996937319-344454492b37" },
    { id: 202, name: "Casual Hoodie", price: 1199, img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246" },
    { id: 203, name: "Sports Watch", price: 1499, img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf" },
    { id: 204, name: "Travel Backpack", price: 1799, img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62" },
  ];

  const reviews = [
    { name: "Priya Sharma", text: "Loved the collection! Great quality & prices.", img: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Rahul Verma", text: "Fast delivery and amazing discounts!", img: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Ananya Rao", text: "Best shopping experience ever!", img: "https://randomuser.me/api/portraits/women/65.jpg" },
  ];

  return (
    <div className={styles.home}>
      {/* Hero Banner */}
      <section
        className={styles.heroBanner}
        style={{ backgroundImage: `url(${banners[currentBanner]})` }}
      >
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <h1>
            Welcome to{" "}
            <span className={styles.brandName}>
              <span style={{ color: "#ff3300ff" }}>Citi</span>
              <span style={{ color: "#2f00ffff" }}>Mart</span>
            </span>
          </h1>
          <p>Shop the latest fashion trends at the best prices!</p>
          <div className={styles.heroButtons}>
            <Link to="/products" className={styles.shopBtn}>Shop Now</Link>
            <Link to="/offers" className={styles.offerBtn}>View Offers</Link>
          </div>
        </div>
      </section>

      {/* Exclusive Offers */}
      <section className={styles.offers}>
        <h2>🔥 Exclusive Offers</h2>
        <div className={styles.offerGrid}>
          {offers.length > 0 ? (
            offers.map((offer) => (
              <Link key={offer._id} to={`/offers/${offer._id}`} className={styles.offerCard}>
                <img src={offer.image || "https://via.placeholder.com/300"} alt={offer.title} />
                <div className={styles.offerText}>
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                </div>
              </Link>
            ))
          ) : (
            <p>No active offers available.</p>
          )}
        </div>
      </section>

      {/* Newly Arrivals */}
      <section className={styles.newArrivals}>
        <h2>🆕 Newly Arrived</h2>
        <div className={styles.productGrid}>
          {newArrivals.length > 0 ? (
            newArrivals.map((p) => (
              <div key={p._id} className={styles.productCard}>
                <img src={p.images?.[0] || "https://via.placeholder.com/200"} alt={p.name} />
                <h3>{p.name}</h3>
                <p>₹{p.price}</p>
                <button className={styles.addCartBtn}>Add to Cart</button>
              </div>
            ))
          ) : (
            <p>No new arrivals yet.</p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className={styles.categories}>
        <h2>🛍️ Shop by Category</h2>
        <div className={styles.categoryGrid}>
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`} className={styles.categoryCard}>
              <img src={c.img} alt={c.name} />
              <h3>{c.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className={styles.trendingNow}>
        <h2>🔥 Trending Now</h2>
        <div className={styles.trendingSlider}>
          {trendingNow.concat(trendingNow).map((item, i) => (
            <div key={i} className={styles.trendingCard}>
              <img src={item.img} alt={item.name} />
              <p>{item.name}</p>
              <span>₹{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Brands */}
      <section className={styles.brands}>
        <h2>🔥 Trending Brands</h2>
        <div className={styles.brandSlider}>
          {brands.map((b, i) => (
            <div key={i} className={styles.brandCard}>
              <img src={b.img} alt={b.name} />
              <p>{b.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.featured}>
        <h2>⭐ Featured Products</h2>
        <div className={styles.productGrid}>
          {featuredProducts.map((p) => (
            <div key={p.id} className={styles.productCard}>
              <img src={p.img} alt={p.name} />
              <h3>{p.name}</h3>
              <p>₹{p.price}</p>
              <p>⭐ {p.rating}</p>
              <button className={styles.addCartBtn}>Add to Cart</button>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.reviews}>
        <h2>💬 What Our Customers Say</h2>
        <div className={styles.reviewSlider}>
          {reviews.map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              <img src={r.img} alt={r.name} />
              <p>"{r.text}"</p>
              <h4>- {r.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className={styles.newsletter}>
        <h2>📲 Download Our App & Get 20% OFF</h2>
        <p>Stay updated with latest trends & offers</p>
        <div className={styles.inputBox}>
          <input type="email" placeholder="Enter your email" />
          <button>Subscribe</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
