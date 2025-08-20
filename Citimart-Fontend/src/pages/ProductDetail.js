import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ProductDetail.module.css";
import {
  FaHeart,
  FaShoppingCart,
  FaShareAlt,
  FaStar,
  FaTag,
  FaPercent,
  FaCreditCard,
} from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);

  const customer = JSON.parse(localStorage.getItem("customer"));

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          const firstImage = data.product.images?.[0];
          setMainImage(
            firstImage?.startsWith("http")
              ? firstImage
              : `http://localhost:5000/${firstImage}`
          );

          fetch("http://localhost:5000/api/products")
            .then((res) => res.json())
            .then((all) => {
              if (all.products) {
                const filtered = all.products
                  .filter(
                    (p) =>
                      p._id !== data.product._id &&
                      p.category === data.product.category
                  )
                  .slice(0, 4);
                setSimilarProducts(filtered);
              }
            });

          // Fetch Frequently Bought Together products
          fetch(
            `http://localhost:5000/api/products/frequently-bought/${id}`
          )
            .then((res) => res.json())
            .then((fbData) => {
              if (fbData.relatedProducts) {
                setFrequentlyBought(fbData.relatedProducts);
              }
            })
            .catch((err) =>
              console.error("Error fetching frequently bought products:", err)
            );
        }
      });
  }, [id]);

  // ✅ Add to Cart API
  const addToCartAPI = async (productId, size = selectedSize) => {
    if (!customer) return navigate("/login");
    if (!size) return alert("Please select a size");

    try {
      const res = await fetch("http://localhost:5000/customer/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customer.token}`,
        },
        body: JSON.stringify({
          customer_id: customer.id,
          product_id: productId,
          size,
          quantity,
        }),
      });

      const data = await res.json();
      if (data.message === "Added to cart") {
        alert("✅ Added to Cart!");
      } else {
        alert(`❌ ${data.error || "Failed to add to cart"}`);
      }
    } catch {
      alert("Error adding to cart");
    }
  };

  // ✅ Add to Wishlist API
  const addToWishlistAPI = async (productId, size = selectedSize || "N/A") => {
    if (!customer) return navigate("/login");

    try {
      const res = await fetch("http://localhost:5000/customer/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customer.token}`,
        },
        body: JSON.stringify({
          customer_id: customer.id,
          product_id: productId,
          size,
        }),
      });

      const data = await res.json();
      if (data.message === "Added to wishlist") {
        alert("❤️ Added to Wishlist!");
      } else {
        alert(`❌ ${data.error || "Failed to add to wishlist"}`);
      }
    } catch {
      alert("Error adding to wishlist");
    }
  };

  const handleAddToCart = () => addToCartAPI(product._id);
  const handleBuyNow = async () => {
    await addToCartAPI(product._id);
    navigate("/checkout");
  };
  const handleWishlist = () => addToWishlistAPI(product._id);

  const checkDelivery = () => {
    if (pincode.length !== 6) {
      setDeliveryMsg("Enter a valid pincode");
    } else {
      setDeliveryMsg("Delivery available in 3-5 days 🚚");
    }
  };
  // Add this helper inside your component, before return:
const addBothToCart = async () => {
  if (!customer) return navigate("/login");

  // Add main product first
  if (!selectedSize) {
    alert("Please select a size for the main product");
    return;
  }

  try {
    // Add main product
    await addToCartAPI(product._id, selectedSize);

    // Add all frequently bought products, use first variant size or "N/A"
    for (const fbProduct of frequentlyBought) {
      const fbSize = fbProduct.variants?.[0]?.size || "N/A";
      await addToCartAPI(fbProduct._id, fbSize);
    }

    alert("✅ Added main and frequently bought products to cart!");
  } catch (error) {
    alert("❌ Error adding products to cart");
  }
};



  if (!product) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.amazonLayout}>
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <div className={styles.imageGallery}>
          <div className={styles.thumbnails}>
            {product.images?.map((img, i) => {
              const url = img.startsWith("http")
                ? img
                : `http://localhost:5000/${img}`;
              return (
                <img
                  key={i}
                  src={url}
                  onClick={() => setMainImage(url)}
                  className={mainImage === url ? styles.activeThumb : ""}
                  alt=""
                />
              );
            })}
          </div>
          <div className={styles.mainImage}>
            <img src={mainImage} alt={product.name} />
            <button
              className={styles.shareIcon}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Product link copied!");
              }}
            >
              <FaShareAlt />
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className={styles.middleSection}>
        <h2 className={styles.title}>{product.name}</h2>
        <div className={styles.vendor}>
          <h3>Brand: {product.brand}</h3>
        </div>

        <div className={styles.rating}>
          <span className={styles.star}>
            <FaStar /> 4.3
          </span>
          <span className={styles.reviewCount}>1,245 ratings</span>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.currentPrice}>₹{product.price}</span>
          {product.discount > 0 && (
            <>
              <span className={styles.originalPrice}>
                ₹{(product.price / (1 - product.discount / 100)).toFixed(0)}
              </span>
              <span className={styles.discount}>{product.discount}% OFF</span>
            </>
          )}
        </div>

        <div className={styles.couponBox}>
          <FaTag /> Apply ₹50 coupon & save extra!
        </div>

        <div className={styles.offersBox}>
          <h4>Available Offers:</h4>
          <ul>
            <li>
              <FaPercent /> Get 10% cashback on UPI payments
            </li>
            <li>
              <FaPercent /> Flat ₹100 OFF on your first order
            </li>
            <li>
              <FaPercent /> Buy 2 get 5% OFF, Buy 3 get 10% OFF
            </li>
          </ul>
        </div>

        <div className={styles.emiBox}>
          <FaCreditCard /> EMI starts at ₹499/month. <span>View Plans</span>
        </div>

        {/* COLORS */}
        {product.colors?.length > 0 && (
          <div className={styles.colorSection}>
            <h4>Color:</h4>
            <div className={styles.colorOptions}>
              {product.colors.map((c, i) => (
                <button
                  key={i}
                  style={{ backgroundColor: c }}
                  className={`${styles.colorBtn} ${
                    selectedColor === c ? styles.selectedColor : ""
                  }`}
                  onClick={() => setSelectedColor(c)}
                ></button>
              ))}
            </div>
          </div>
        )}

        {/* SIZES */}
        {product.variants?.length > 0 && (
          <div className={styles.sizeSection}>
            <h4>Size:</h4>
            <div className={styles.sizeOptions}>
              {product.variants.map((v, i) => (
                <button
                  key={i}
                  className={`${styles.sizeBtn} ${
                    selectedSize === v.size ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedSize(v.size)}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.description}>
          <h3>Product Details</h3>
          <p>{product.description}</p>
          <ul>
            {product.specifications?.map((spec, i) => (
              <li key={i}>
                <strong>{spec.label}:</strong> {spec.value}
              </li>
            ))}
          </ul>
        </div>

        {/* ✅ Frequently Bought Together */}
        <div className={styles.fbt}>
          <h3>Frequently Bought Together</h3>
          <div className={styles.fbtItems}>
            <div>
              <img src={mainImage} alt={product.name} />
              <p>₹{product.price}</p>
            </div>

            {frequentlyBought.length > 0 &&
              frequentlyBought.map((fbProduct, i) => (
                <React.Fragment key={fbProduct._id}>
                  <span>+</span>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/product/${fbProduct._id}`)}
                  >
                    <img
                      src={
                        fbProduct.images?.[0]?.startsWith("http")
                          ? fbProduct.images[0]
                          : `http://localhost:5000/${fbProduct.images?.[0]}`
                      }
                      alt={fbProduct.name}
                    />
                    <p>₹{fbProduct.price}</p>
                  </div>
                </React.Fragment>
              ))}
          </div>
          <button className={styles.addBothBtn} onClick={addBothToCart}>
           Add Both to Cart
          </button>

        </div>

        {/* ✅ Similar Products */}
        <div className={styles.similarProducts}>
          <h3>Similar Products</h3>
          <div className={styles.similarGrid}>
            {similarProducts.map((sp) => (
              <div key={sp._id} className={styles.similarCard}>
                <img
                  src={
                    sp.images?.[0]?.startsWith("http")
                      ? sp.images[0]
                      : `http://localhost:5000/${sp.images?.[0]}`
                  }
                  alt={sp.name}
                  onClick={() => navigate(`/products/${sp._id}`)}
                  style={{ cursor: "pointer" }}
                />
                <p>{sp.name}</p>
                <strong>₹{sp.price}</strong>

                <div className={styles.similarActions}>
                  <button
                    className={styles.wishlistIcon}
                    onClick={() => addToWishlistAPI(sp._id)}
                  >
                    <FaHeart />
                  </button>

                  <button
                    className={styles.cartBtn}
                    onClick={() =>
                      addToCartAPI(sp._id, sp.variants?.[0]?.size || "N/A")
                    }
                  >
                    <FaShoppingCart /> Cart
                  </button>

                  <button
                    className={styles.buyBtn}
                    onClick={async () => {
                      await addToCartAPI(
                        sp._id,
                        sp.variants?.[0]?.size || "N/A"
                      );
                      navigate("/checkout");
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.rightSection}>
        <div className={styles.priceRight}>₹{product.price}</div>
        <h4 className={styles.deliveryHeading}>Delivery Options</h4>
        <div className={styles.deliveryCheck}>
          <input
            type="text"
            placeholder="Enter pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
          <button onClick={checkDelivery}>Check</button>
        </div>
        {deliveryMsg && <p className={styles.deliveryMsg}>{deliveryMsg}</p>}
        <p style={{ color: "green", fontWeight: "bold" }}>In Stock</p>
        <p>
          Ships from: <strong>Citimart</strong>
        </p>
        <p>
          Sold by: <strong>{product.vendor_name || "Vendor"}</strong>
        </p>
        <p>
          Payment: <strong>Secure transaction</strong>
        </p>

        <button className={styles.addToCart} onClick={handleAddToCart}>
          <FaShoppingCart /> Add to Cart
        </button>
        <button className={styles.buyNow} onClick={handleBuyNow}>
          Buy Now
        </button>

        <label className={styles.giftOption}>
          <input type="checkbox" /> Add gift options
        </label>

        <button className={styles.wishlistBtn} onClick={handleWishlist}>
          <FaHeart /> Wishlist
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
