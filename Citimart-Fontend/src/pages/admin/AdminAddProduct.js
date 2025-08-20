import React, { useState } from "react";
import styles from "./AdminAddProduct.module.css";

// ✅ Full Nested Category Data
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

// ✅ Web-Safe Colors with Names
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

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

const AddProduct = () => {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    discount: "",
    description: "",
    specifications: [{ label: "", value: "" }],
    images: [],
    category: "",
    subCategory: "",
    childCategory: "",
    variants: [],
    pairs_with: [], 
    pairs_with_input: "",// or "", if using comma-separated string

  });
  const [colorSearch, setColorSearch] = useState("");
const [selectedTab, setSelectedTab] = useState("All");

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
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [variantInput, setVariantInput] = useState({
    size: "",
    color: "",
    stock: "",
  });

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    setForm((prev) => ({
      ...prev,
      category: e.target.value,
      subCategory: "",
      childCategory: "",
    }));
  };

  const handleSubCategoryChange = (e) => {
    setForm((prev) => ({
      ...prev,
      subCategory: e.target.value,
      childCategory: "",
    }));
  };

  const handleChildCategoryChange = (e) => {
    setForm((prev) => ({ ...prev, childCategory: e.target.value }));
  };

  // ✅ Specifications
  const handleSpecChange = (idx, field, value) => {
    const specs = [...form.specifications];
    specs[idx][field] = value;
    setForm((prev) => ({ ...prev, specifications: specs }));
  };

  const addSpecification = () =>
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { label: "", value: "" }],
    }));

  const removeSpecification = (idx) =>
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== idx),
    }));

  // ✅ Images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // ✅ Variants
  const handleVariantInputChange = (e) => {
    const { name, value } = e.target;
    setVariantInput((prev) => ({ ...prev, [name]: value }));
  };

  const addVariant = () => {
    if (!variantInput.size || !variantInput.color || !variantInput.stock) return;
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, variantInput],
    }));
    setVariantInput({ size: "", color: "", stock: "" });
  };

  const removeVariant = (idx) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));

  // ✅ Reset
  const handleReset = () => {
    setForm({
      name: "",
      brand: "",
      price: "",
      discount: "",
      description: "",
      specifications: [{ label: "", value: "" }],
      images: [],
      category: "",
      subCategory: "",
      childCategory: "",
      variants: [],
    });
    setImagePreviews([]);
    setErrors({});
    setVariantInput({ size: "", color: "", stock: "" });
  };

  // ✅ Validation
  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Product name is required";
    if (!form.brand) newErrors.brand = "Brand is required";
    if (!form.price) newErrors.price = "Price is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!form.subCategory) newErrors.subCategory = "Subcategory is required";
    if (!form.childCategory) newErrors.childCategory = "Child category is required";
    if (form.images.length === 0) newErrors.images = "At least one image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("brand", form.brand);
    formData.append("price", form.price);
    formData.append("discount", form.discount);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("subCategory", form.subCategory);
    formData.append("childCategory", form.childCategory);
    formData.append("specifications", JSON.stringify(form.specifications));
    formData.append("variants", JSON.stringify(form.variants));
    form.images.forEach((file) => formData.append("images", file));
    formData.append("pairs_with", JSON.stringify(form.pairs_with));



    try {
      const response = await fetch("http://localhost:5000/api/products/add", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("✅ Product added successfully!");
        handleReset();
      } else {
        const error = await response.json();
        alert("❌ Failed: " + error.message);
      }
    } catch (err) {
      alert("⚠️ Error adding product");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add Product</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ✅ Product Name */}
        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input name="name" value={form.name} onChange={handleChange} />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        {/* ✅ Brand */}
        <div className={styles.formGroup}>
          <label>Brand</label>
          <input name="brand" value={form.brand} onChange={handleChange} />
          {errors.brand && <span className={styles.error}>{errors.brand}</span>}
        </div>

        {/* ✅ Price & Discount */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
            />
            {errors.price && <span className={styles.error}>{errors.price}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Discount (%)</label>
            <input
              type="number"
              name="discount"
              value={form.discount}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ✅ Variants */}
        <div className={styles.formGroup}>
          <label>Variants</label>
          <div className={styles.variantRow}>
            <select
              name="size"
              value={variantInput.size}
              onChange={handleVariantInputChange}
            >
              <option value="">Size</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="stock"
              placeholder="Stock"
              value={variantInput.stock}
              onChange={handleVariantInputChange}
            />
          </div>

          {/* ✅ Color Palette */}
          {/* ✅ Color Selection */}
<div className={styles.formGroup}>
  <label>Pick Color</label>

  {/* 🔍 Search Bar */}
  <input
    type="text"
    placeholder="Search color..."
    value={colorSearch}
    onChange={(e) => setColorSearch(e.target.value)}
    className={styles.colorSearch}
  />

  {/* 🟢 Tabs for quick filter */}
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

  {/* 🎨 Scrollable Color Grid */}
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


          <button type="button" onClick={addVariant} className={styles.addBtn}>
            Add Variant
          </button>

          <div>
            {form.variants.map((v, i) => (
              <div key={i} className={styles.variantItem}>
                <span>
                  Size: {v.size} | Color:{" "}
                  <span
                    style={{
                      background: v.color,
                      padding: "0 8px",
                      border: "1px solid #000",
                    }}
                  ></span>{" "}
                  | Stock: {v.stock}
                </span>
                <button type="button" onClick={() => removeVariant(i)}>
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Category → Subcategory → Child Category */}
        <div className={styles.formGroup}>
          <label>Category</label>
          <select value={form.category} onChange={handleCategoryChange}>
            <option value="">Select Category</option>
            {Object.keys(CATEGORY_OPTIONS).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <span className={styles.error}>{errors.category}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Subcategory</label>
          <select
            value={form.subCategory}
            onChange={handleSubCategoryChange}
            disabled={!form.category}
          >
            <option value="">Select Subcategory</option>
            {form.category &&
              Object.keys(CATEGORY_OPTIONS[form.category]).map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
          </select>
          {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>Child Category</label>
          <select
            value={form.childCategory}
            onChange={handleChildCategoryChange}
            disabled={!form.subCategory}
          >
            <option value="">Select Child Category</option>
            {form.subCategory &&
              CATEGORY_OPTIONS[form.category][form.subCategory].map((child) => (
                <option key={child} value={child}>
                  {child}
                </option>
              ))}
          </select>
          {errors.childCategory && (
            <span className={styles.error}>{errors.childCategory}</span>
          )}
        </div>

        {/* ✅ Images */}
        <div className={styles.formGroup}>
          <label>Product Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
          {errors.images && <span className={styles.error}>{errors.images}</span>}
          <div className={styles.previewRow}>
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt="preview" />
            ))}
          </div>
        </div>

        {/* ✅ Specifications */}
        <div className={styles.formGroup}>
          <label>Specifications</label>
          {form.specifications.map((spec, i) => (
            <div key={i} className={styles.specRow}>
              <input
                placeholder="Label"
                value={spec.label}
                onChange={(e) => handleSpecChange(i, "label", e.target.value)}
              />
              <input
                placeholder="Value"
                value={spec.value}
                onChange={(e) => handleSpecChange(i, "value", e.target.value)}
              />
              {form.specifications.length > 1 && (
                <button type="button" onClick={() => removeSpecification(i)}>
                  ❌
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSpecification} className={styles.addBtn}>
            ➕ Add Specification
          </button>
        </div>

        {/* ✅ Description */}
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        {/* ✅ Pairs With (Comma-separated Product IDs or names) */}
         {/* ✅ Pairs With (Add individually) */}
<div className={styles.formGroup}>
  <label>Pairs With (Product IDs)</label>
  <div className={styles.pairInputRow}>
    <input
      type="text"
      placeholder="Enter product ID"
      value={form.pairs_with_input || ""}
      onChange={(e) =>
        setForm((prev) => ({ ...prev, pairs_with_input: e.target.value }))
      }
    />
    <button
      type="button"
      onClick={() => {
        const newId = (form.pairs_with_input || "").trim();
        if (newId && !form.pairs_with.includes(newId)) {
          setForm((prev) => ({
            ...prev,
            pairs_with: [...prev.pairs_with, newId],
            pairs_with_input: "",
          }));
        }
      }}
      className={styles.addBtn}
    >
      ➕ Add
    </button>
  </div>

  {/* Show added pair IDs */}
  <div className={styles.pairList}>
    {form.pairs_with.map((id, i) => (
      <div key={i} className={styles.pairItem}>
        <span>{id}</span>
        <button
          type="button"
          onClick={() =>
            setForm((prev) => ({
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




        {/* ✅ Submit & Reset */}
        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn}>
            Submit
          </button>
          <button type="button" onClick={handleReset} className={styles.resetBtn}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
