import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EditProduct.module.css";

// ✅ Nested Categories
const CATEGORY_OPTIONS = {
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

// ✅ Web-Safe Color List
const hexValues = ["00", "33", "66", "99", "CC", "FF"];
const WEB_SAFE_COLORS = [];
for (let r of hexValues) {
  for (let g of hexValues) {
    for (let b of hexValues) {
      const hex = `#${r}${g}${b}`;
      WEB_SAFE_COLORS.push({ name: hex, hex });
    }
  }
}

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    brand: "",
    discount: "",
    status: "active",
    price: "",
    category: "",
    subCategory: "",
    childCategory: "",
    variants: [],
    images: [],
    specifications: [],
    pairs_with: [],
  });

  const [newImages, setNewImages] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" });
  const [colorSearch, setColorSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [pairsWithInput, setPairsWithInput] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          if (data.product.added_by !== "admin") {
            alert("You are not allowed to edit vendor products.");
            navigate("/admin/products");
          } else {
            setProductData({
              ...data.product,
              childCategory: data.product.childCategory || "",
              pairs_with: data.product.pairs_with || [],
            });
            setSpecifications(data.product.specifications || []);
          }
        } else {
          alert("Product not found");
          navigate("/admin/products");
        }
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        alert("Failed to load product");
        navigate("/admin/products");
      });
  }, [id, navigate]);

  const handleChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...productData.variants];
    updated[index][field] = value;
    setProductData({ ...productData, variants: updated });
  };

  const handleImageChange = (e) => {
    setNewImages([...e.target.files]);
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("description", productData.description);
    formData.append("brand", productData.brand);
    formData.append("discount", productData.discount || 0);
    formData.append("status", productData.status || "active");
    formData.append("price", productData.price);
    formData.append("category", productData.category);
    formData.append("subCategory", productData.subCategory);
    formData.append("childCategory", productData.childCategory || "");
    formData.append("variants", JSON.stringify(productData.variants || []));
   productData.specifications = specifications;
   formData.append("specifications", JSON.stringify(productData.specifications));

    formData.append("pairs_with", JSON.stringify(productData.pairs_with || []));
    formData.append("is_admin", "true");

    newImages.forEach((img) => {
      formData.append("images", img);
    });

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/${id}?is_admin=true`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (res.ok) {
        alert("Product updated successfully!");
        navigate("/admin/products");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update product.");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("An error occurred while updating.");
    }
  };

  const filterByTab = (color) => {
    if (selectedTab === "All") return true;
    if (selectedTab === "Red") return color.hex.includes("FF0000") || color.hex.startsWith("#FF");
    if (selectedTab === "Green") return color.hex.includes("00FF00") || color.hex.startsWith("#0F");
    if (selectedTab === "Blue") return color.hex.includes("0000FF") || color.hex.startsWith("#00");
    if (selectedTab === "Gray") return color.hex[1] === color.hex[3] && color.hex[3] === color.hex[5];
    return true;
  };

  const filteredColors = WEB_SAFE_COLORS.filter(
    (c) =>
      c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c)
  );

  return (
    <div className={styles.editProduct}>
      <h2>Edit Product</h2>
      <form onSubmit={updateProduct} className={styles.form} encType="multipart/form-data">
        <input name="name" value={productData.name} onChange={handleChange} placeholder="Product Name" required />
        <input name="brand" value={productData.brand} onChange={handleChange} placeholder="Brand" required />
        <input name="discount" value={productData.discount} onChange={handleChange} placeholder="Discount %" type="number" />
        <input name="price" value={productData.price} onChange={handleChange} placeholder="Price" type="number" required />

        <select
          name="category"
          value={productData.category}
          onChange={(e) =>
            setProductData({ ...productData, category: e.target.value, subCategory: "", childCategory: "" })
          }
          required
        >
          <option value="">Select Category</option>
          {Object.keys(CATEGORY_OPTIONS).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          name="subCategory"
          value={productData.subCategory}
          onChange={(e) =>
            setProductData({ ...productData, subCategory: e.target.value, childCategory: "" })
          }
          required
        >
          <option value="">Select Subcategory</option>
          {productData.category &&
            Object.keys(CATEGORY_OPTIONS[productData.category] || {}).map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
        </select>

        <select
          name="childCategory"
          value={productData.childCategory}
          onChange={handleChange}
        >
          <option value="">Select Child Category (Optional)</option>
          {productData.category &&
            productData.subCategory &&
            (CATEGORY_OPTIONS[productData.category]?.[productData.subCategory] || []).map((child) => (
              <option key={child} value={child}>{child}</option>
            ))}
        </select>

        <textarea
          name="description"
          value={productData.description}
          onChange={handleChange}
          placeholder="Description"
          required
        />

        <h4>Add Variant</h4>
        <div className={styles.variantRow}>
          <input
            name="size"
            placeholder="Size"
            value={variantInput.size}
            onChange={(e) => setVariantInput({ ...variantInput, size: e.target.value })}
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={variantInput.stock}
            onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })}
          />
        </div>

        {/* Color Picker */}
        <div className={styles.formGroup}>
          <label>Pick Color</label>
          <input
            type="text"
            placeholder="Search color..."
            value={colorSearch}
            onChange={(e) => setColorSearch(e.target.value)}
            className={styles.colorSearch}
          />
          <div className={styles.colorTabs}>
            {["All", "Red", "Green", "Blue", "Gray"].map((tab) => (
              <button
                key={tab}
                className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
                onClick={() => setSelectedTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.colorPalette}>
            {filteredColors.map(({ name, hex }) => (
              <div
                key={hex}
                className={`${styles.colorCircle} ${variantInput.color === hex ? styles.selected : ""}`}
                style={{ backgroundColor: hex }}
                onClick={() => setVariantInput((prev) => ({ ...prev, color: hex }))}
              >
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!variantInput.size || !variantInput.color || !variantInput.stock) return;
            setProductData((prev) => ({
              ...prev,
              variants: [...prev.variants, variantInput],
            }));
            setVariantInput({ size: "", color: "", stock: "" });
          }}
        >
          + Add Variant
        </button>
        {productData.variants.length > 0 && (
  <div>
    <h5>Existing Variants</h5>
    {productData.variants.map((v, i) => (
      <div key={i} className={styles.variantRow}>
        <input
          value={v.size}
          onChange={(e) => handleVariantChange(i, "size", e.target.value)}
          placeholder="Size"
        />
        <input
          type="text"
          value={v.color}
          onChange={(e) => handleVariantChange(i, "color", e.target.value)}
          placeholder="Color"
        />
        <input
          type="number"
          value={v.stock}
          onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
          placeholder="Stock"
        />
        <button
          type="button"
          onClick={() => {
            const updated = [...productData.variants];
            updated.splice(i, 1);
            setProductData({ ...productData, variants: updated });
          }}
        >
          ❌
        </button>
      </div>
    ))}
  </div>
)}


        <div>
          <label>Upload New Images:</label>
          <input
            type="file"
            name="images"
            onChange={handleImageChange}
            multiple
            accept="image/*"
          />
        </div>

        {productData.images?.length > 0 && (
          <div className={styles.imagePreview}>
            <h4>Existing Images:</h4>
            <div className={styles.previewGrid}>
              {productData.images.map((img, i) => (
                <img
                  key={i}
                  src={img.startsWith("http") ? img : `http://localhost:5000/${img}`}
                  alt={`Preview ${i}`}
                  className={styles.previewImg}
                />
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
        <h4>Specifications</h4>
        {specifications.map((spec, i) => (
          <div key={i} className={styles.specRow}>
            <input
              placeholder="Label"
              value={spec.label}
              onChange={(e) => {
                const updated = [...specifications];
                updated[i].label = e.target.value;
                setSpecifications(updated);
              }}
            />
            <input
              placeholder="Value"
              value={spec.value}
              onChange={(e) => {
                const updated = [...specifications];
                updated[i].value = e.target.value;
                setSpecifications(updated);
              }}
            />
            <button
              type="button"
              onClick={() =>
                setSpecifications(specifications.filter((_, index) => index !== i))
              }
            >
              ❌
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setSpecifications([...specifications, { label: "", value: "" }])}>
          ➕ Add Specification
        </button>

        {/* Pairs With */}
        <div className={styles.formGroup}>
          <label>Pairs With (Product IDs)</label>
          <div className={styles.pairInputRow}>
            <input
              type="text"
              placeholder="Enter product ID"
              value={pairsWithInput}
              onChange={(e) => setPairsWithInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                const newId = pairsWithInput.trim();
                if (newId && !productData.pairs_with.includes(newId)) {
                  setProductData((prev) => ({
                    ...prev,
                    pairs_with: [...prev.pairs_with, newId],
                  }));
                  setPairsWithInput("");
                }
              }}
            >
              ➕ Add
            </button>
          </div>

          <div className={styles.pairList}>
            {productData.pairs_with.map((id, i) => (
              <div key={i} className={styles.pairItem}>
                <span>{id}</span>
                <button
                  type="button"
                  onClick={() =>
                    setProductData((prev) => ({
                      ...prev,
                      pairs_with: prev.pairs_with.filter((_, idx) => idx !== i),
                    }))
                  }
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit">Update Product</button>
      </form>
    </div>
  );
};

export default EditProduct;
