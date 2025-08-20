import React, { useState, useEffect } from "react";
import styles from "./AddProduct.module.css"; // adjust path if needed

// Web-safe colors
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
  // States for categories
  const [approvedCategories, setApprovedCategories] = useState([]); 
  const [approvedSubcategories, setApprovedSubcategories] = useState({}); 
  const [approvedChildcategories, setApprovedChildcategories] = useState({}); 

  const [loadingCategories, setLoadingCategories] = useState(true);

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
    pairs_with_input: "",
  });

  const [colorSearch, setColorSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/vendor/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Vendor Profile data:", data); // <-- Debug log for response shape

          // Adjust these keys if your API response is different
          setApprovedCategories(data.approved_categories || []);
          setApprovedSubcategories(data.approved_subcategories || {});
          setApprovedChildcategories(data.approved_childcategories || {});
        } else {
          console.error("Failed to load vendor profile categories");
          setApprovedCategories([]);
          setApprovedSubcategories({});
          setApprovedChildcategories({});
        }
      } catch (err) {
        console.error("Error loading vendor profile:", err);
        setApprovedCategories([]);
        setApprovedSubcategories({});
        setApprovedChildcategories({});
      }
      setLoadingCategories(false);
    };

    fetchVendorProfile();
  }, []);

  // Color filtering
  const filterByTab = (color) => {
    if (selectedTab === "All") return true;
    if (selectedTab === "Red") return color.hex.toUpperCase().startsWith("#FF");
    if (selectedTab === "Green") return color.hex.toUpperCase().startsWith("#0F");
    if (selectedTab === "Blue") return color.hex.toUpperCase().startsWith("#00");
    if (selectedTab === "Gray")
      return color.hex[1] === color.hex[3] && color.hex[3] === color.hex[5];
    return true;
  };

  const filteredColors = WEB_SAFE_COLORS.filter(
    (c) => c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c)
  );

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;
    setForm((prev) => ({
      ...prev,
      category: selectedCategory,
      subCategory: "",
      childCategory: "",
    }));
  };

  const handleSubCategoryChange = (e) => {
    const selectedSub = e.target.value;
    setForm((prev) => ({
      ...prev,
      subCategory: selectedSub,
      childCategory: "",
    }));
  };

  const handleChildCategoryChange = (e) => {
    setForm((prev) => ({ ...prev, childCategory: e.target.value }));
  };

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

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
      pairs_with: [],
      pairs_with_input: "",
    });
    setImagePreviews([]);
    setErrors({});
    setVariantInput({ size: "", color: "", stock: "" });
    setColorSearch("");
    setSelectedTab("All");
  };

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
    formData.append("subcategory", form.subCategory);
    formData.append("childcategory", form.childCategory);
    formData.append("specifications", JSON.stringify(form.specifications));
    formData.append("variants", JSON.stringify(form.variants));
    formData.append("pairs_with", JSON.stringify(form.pairs_with));

    form.images.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const token = localStorage.getItem("token"); // <-- Get token here
      const response = await fetch("http://localhost:5000/vendor/add-product", {
        method: "POST",
        credentials: "include",
         headers: {
        Authorization: `Bearer ${token}`, // <-- Add this header!
      },
        body: formData,
      });

      if (response.ok) {
        alert("✅ Product added successfully!");
        handleReset();
      } else {
        const error = await response.json();
        alert("❌ Failed: " + (error.error || error.message || "Unknown error"));
      }
    } catch (err) {
      alert("⚠️ Error adding product");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add Product</h1>

      {loadingCategories ? (
        <p>Loading categories...</p>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className={styles.formGroup}>
            <label>Product Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          {/* Brand */}
          <div className={styles.formGroup}>
            <label>Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange} />
            {errors.brand && <span className={styles.error}>{errors.brand}</span>}
          </div>

          {/* Price & Discount */}
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

          {/* Variants */}
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

            {/* Color Palette */}
            <div className={styles.formGroup}>
              <label>Pick Color</label>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search color..."
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                className={styles.colorSearch}
              />

              {/* Tabs */}
              <div className={styles.colorTabs}>
                {["All", "Red", "Green", "Blue", "Gray"].map((tab) => (
                  <button
                    key={tab}
                    className={`${styles.colorTab} ${
                      selectedTab === tab ? styles.activeTab : ""
                    }`}
                    onClick={() => setSelectedTab(tab)}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Color grid */}
              <div className={styles.colorPalette}>
                {filteredColors.map(({ name, hex }) => (
                  <div
                    key={hex}
                    className={`${styles.colorCircle} ${
                      variantInput.color === hex ? styles.selected : ""
                    }`}
                    style={{ backgroundColor: hex }}
                    onClick={() =>
                      setVariantInput((prev) => ({ ...prev, color: hex }))
                    }
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

          {/* Category */}
          <div className={styles.formGroup}>
            <label>Category</label>
            <select value={form.category} onChange={handleCategoryChange}>
              <option value="">Select Category</option>
              {approvedCategories.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
            {errors.category && <span className={styles.error}>{errors.category}</span>}
          </div>

          {/* Subcategory */}
          <div className={styles.formGroup}>
            <label>Subcategory</label>
            <select
              value={form.subCategory}
              onChange={handleSubCategoryChange}
              disabled={!form.category}
            >
              <option value="">Select Subcategory</option>
              {(approvedSubcategories[form.category] || []).map((subName) => (
                <option key={subName} value={subName}>
                  {subName}
                </option>
              ))}
            </select>
            {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
          </div>

          {/* Child Category */}
          <div className={styles.formGroup}>
            <label>Child Category</label>
            <select
              value={form.childCategory}
              onChange={handleChildCategoryChange}
              disabled={!form.subCategory}
            >
              <option value="">Select Child Category</option>
              {(approvedChildcategories[form.subCategory] || []).map((childName) => (
                <option key={childName} value={childName}>
                  {childName}
                </option>
              ))}
            </select>
            {errors.childCategory && <span className={styles.error}>{errors.childCategory}</span>}
          </div>

          {/* Images */}
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

          {/* Specifications */}
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

          {/* Description */}
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} />
          </div>

          {/* Pairs With */}
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

          {/* Submit & Reset */}
          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn}>
              Submit
            </button>
            <button type="button" onClick={handleReset} className={styles.resetBtn}>
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddProduct;
