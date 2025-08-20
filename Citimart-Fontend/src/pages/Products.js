import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Products.module.css";
import { FaTags, FaRupeeSign, FaShoppingBag, FaSort, FaListUl, FaClock } from "react-icons/fa";

// ✅ Complete Categories → Subcategories → Child Categories
const categoriesData = {
  Clothing: {
    Men: ["Ethnic Wear", "Jeans", "Joggers", "Pants", "Shirts", "T-Shirts"],
    Women: ["Tops", "Pants", "Jeans", "Skirts", "Ethnic Wear"],
    "Kids Boys": ["T-Shirts", "Jeans", "Shorts", "Ethnic Wear"],
    "Kids Girls": ["Dresses", "Tops", "Jeans", "Skirts", "Ethnic Wear"],
  },
  Accessories: {
    "Men's Accessories": ["Belts", "Wallets", "Watches", "Sunglasses"],
    "Women's Accessories": ["Handbags", "Jewelry", "Watches", "Sunglasses"],
  },
  Handmade: {
    "Art & Crafts": ["Paintings", "Sculptures", "Decor Items"],
    Jewelry: ["Earrings", "Necklaces", "Bracelets"],
    Gifts: ["Personalized Gifts", "Handmade Cards", "Gift Hampers"],
  },
  "Home & Decor": {
    Bedsheets: ["Cotton", "Silk", "Printed"],
    Lighting: ["Lamps", "Ceiling Lights", "Fairy Lights"],
    Utensils: ["Cookware", "Dinner Sets", "Storage Jars"],
  },
};

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Products = () => {
  const location = useLocation();
  const query = useQuery();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [childCategory, setChildCategory] = useState("");

  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [newArrival, setNewArrival] = useState(false);

  const [popupType, setPopupType] = useState("");

  // Price Ranges
  const priceRanges = [
    { label: "Under ₹500", value: "0-500" },
    { label: "₹500 - ₹1000", value: "500-1000" },
    { label: "₹1000 - ₹2000", value: "1000-2000" },
    { label: "Above ₹2000", value: "2000-above" },
  ];

  // Sorting Options
  const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
  ];

  const getImageUrl = (image) => {
    if (!image) return "/images/default-placeholder.png";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  // Fetch Products
  useEffect(() => {
    fetch("http://localhost:5000/api/products/all")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Error loading products:", err));
  }, []);

  // Sync state with URL query params on mount and when location.search changes
  useEffect(() => {
    const cat = query.get("category") || "";
    const subCat = query.get("subcategory") || "";
    const childCat = query.get("childcategory") || "";

    // Replace dashes with spaces to match your product data keys
    setCategory(cat.replace(/-/g, " "));
    setSubCategory(subCat.replace(/-/g, " "));
    setChildCategory(childCat.replace(/-/g, " "));
  }, [location.search]); // Run whenever the URL query params change

  // Apply Filters
  useEffect(() => {
    let filteredList = [...products];

    if (category)
      filteredList = filteredList.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );

    if (subCategory)
      filteredList = filteredList.filter(
        (p) => p.subCategory?.toLowerCase() === subCategory.toLowerCase()
      );

    if (childCategory)
      filteredList = filteredList.filter(
        (p) => p.childCategory?.toLowerCase() === childCategory.toLowerCase()
      );

    if (selectedPrice) {
      const [min, max] = selectedPrice.split("-");
      filteredList = filteredList.filter((p) =>
        max === "above"
          ? p.price > parseInt(min)
          : p.price >= parseInt(min) && p.price <= parseInt(max)
      );
    }

    if (selectedBrand)
      filteredList = filteredList.filter(
        (p) => p.brand?.toLowerCase() === selectedBrand.toLowerCase()
      );

    if (newArrival)
      filteredList = filteredList.filter((p) => p.isNewArrival === true);

    if (sortOption === "price_asc")
      filteredList.sort((a, b) => a.price - b.price);

    if (sortOption === "price_desc")
      filteredList.sort((a, b) => b.price - a.price);

    if (sortOption === "newest")
      filteredList.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

    setFiltered(filteredList);
  }, [
    category,
    subCategory,
    childCategory,
    selectedPrice,
    selectedBrand,
    newArrival,
    sortOption,
    products,
  ]);

  const uniqueBrands = [
    ...new Set(products.map((p) => p.brand && p.brand.trim())),
  ].filter(Boolean);

  return (
    <div className={styles.products}>
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>
          {childCategory || subCategory || category || "All Products"}
        </h2>

        {/* FILTER BUTTONS */}
        <div className={styles.topbar}>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("category")}
          >
            <FaTags /> Category
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("subcategory")}
          >
            <FaListUl /> Subcategory
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("childCategory")}
          >
            <FaListUl /> Child Category
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("price")}
          >
            <FaRupeeSign /> Price
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("brand")}
          >
            <FaShoppingBag /> Brand
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("sort")}
          >
            <FaSort /> Sort
          </button>
          <button
            className={styles.circleButton}
            onClick={() => setPopupType("newArrival")}
          >
            <FaClock /> New Arrivals
          </button>
        </div>

        {/* POPUP FILTERS */}
        {popupType && (
          <div
            className={styles.popupOverlay}
            onClick={() => setPopupType("")}
          >
            <div
              className={styles.popup}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Select {popupType}</h3>
              <div className={styles.popupOptions}>
                {popupType === "category" &&
                  Object.keys(categoriesData).map((cat) => (
                    <div
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setSubCategory("");
                        setChildCategory("");
                        setPopupType("");
                      }}
                    >
                      {cat}
                    </div>
                  ))}

                {popupType === "subcategory" &&
                  category &&
                  Object.keys(categoriesData[category]).map((sub) => (
                    <div
                      key={sub}
                      onClick={() => {
                        setSubCategory(sub);
                        setChildCategory("");
                        setPopupType("");
                      }}
                    >
                      {sub}
                    </div>
                  ))}

                {popupType === "childCategory" &&
                  category &&
                  subCategory &&
                  categoriesData[category][subCategory]?.map((child) => (
                    <div
                      key={child}
                      onClick={() => {
                        setChildCategory(child);
                        setPopupType("");
                      }}
                    >
                      {child}
                    </div>
                  ))}

                {popupType === "price" &&
                  priceRanges.map((range) => (
                    <div
                      key={range.value}
                      onClick={() => {
                        setSelectedPrice(range.value);
                        setPopupType("");
                      }}
                    >
                      {range.label}
                    </div>
                  ))}

                {popupType === "brand" &&
                  uniqueBrands.map((brand) => (
                    <div
                      key={brand}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setPopupType("");
                      }}
                    >
                      {brand}
                    </div>
                  ))}

                {popupType === "sort" &&
                  sortOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value);
                        setPopupType("");
                      }}
                    >
                      {option.label}
                    </div>
                  ))}

                {popupType === "newArrival" && (
                  <>
                    <div
                      onClick={() => {
                        setNewArrival(true);
                        setPopupType("");
                      }}
                    >
                      Show New Arrivals
                    </div>
                    <div
                      onClick={() => {
                        setNewArrival(false);
                        setPopupType("");
                      }}
                    >
                      Hide New Arrivals
                    </div>
                  </>
                )}
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setPopupType("")}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        <div className={styles.productGrid}>
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <div key={product._id} className={styles.productCard}>
                <Link to={`/products/${product._id}`}>
                  <img
                    src={getImageUrl(product.images?.[0])}
                    alt={product.name}
                  />
                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <p className={styles.brand}>{product.brand}</p>
                    <p className={styles.price}>₹{product.price}</p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p style={{ marginTop: 40 }}>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
