import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './EditProducts.module.css';

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const vendorId = localStorage.getItem('vendor_id');

  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    subcategory: '',
    childcategory: '',
    price: '',
    discount: '',
    description: '',
    status: 'active',
    variants: [],
    specifications: [],
    images: [],
    pairs_with: [], // added
  });
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${productId}`);
        const data = await res.json();
        if (res.ok && data.product) {
          if (data.product.added_by !== 'vendor' || data.product.vendor_id !== vendorId) {
            alert('You are not authorized to edit this product.');
            navigate('/vendor/products');
            return;
          }

          setProduct(data.product);
          setFormData({
            name: data.product.name || '',
            brand: data.product.brand || '',
            category: data.product.category || '',
            subcategory: data.product.subcategory || '',
            childcategory: data.product.childcategory || '',
            price: data.product.price || '',
            discount: data.product.discount || '',
            description: data.product.description || '',
            status: data.product.status || 'active',
            variants: data.product.variants || [],
            specifications: data.product.specifications || [],
            images: data.product.images || [],
            pairs_with: data.product.pairs_with || [],
          });
        } else {
          alert('Product not found');
          navigate('/vendor/products');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        alert('Error loading product');
        navigate('/vendor/products');
      }
    };

    fetchProduct();
  }, [productId, vendorId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePairsWithChange = (e) => {
    const input = e.target.value;
    const pairsArray = input
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    setFormData((prev) => ({
      ...prev,
      pairs_with: pairsArray,
    }));
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock: '' }],
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      variants: updatedVariants,
    }));
  };

  const handleAddSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecs = [...formData.specifications];
    updatedSpecs[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      specifications: updatedSpecs,
    }));
  };

  const handleImageUpload = (e) => {
    setNewImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    for (const key in formData) {
      if (['variants', 'specifications', 'pairs_with'].includes(key)) {
        form.append(key, JSON.stringify(formData[key]));
      } else if (key !== 'images') {
        form.append(key, formData[key]);
      }
    }

    form.append('vendor_id', vendorId);
    form.append('is_admin', 'false');

    newImages.forEach((file) => {
      form.append('images', file);
    });

    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        body: form,
      });
      const result = await res.json();
      if (res.ok) {
        alert('Product updated successfully');
        navigate('/vendor/products');
      } else {
        alert(result.error || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Server error');
    }
  };

  if (!product) {
    return <div className={styles.loading}>Loading product...</div>;
  }

  return (
    <div className={styles.editProduct}>
      <h2>Edit Product</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" required />
        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" required />

        <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="Category" required />
        <input type="text" name="subcategory" value={formData.subcategory} onChange={handleInputChange} placeholder="Subcategory" />
        <input type="text" name="childcategory" value={formData.childcategory} onChange={handleInputChange} placeholder="Childcategory" />

        <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" required />
        <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} placeholder="Discount %" />
        <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" required />

        <div>
          <label>Pairs With (Product IDs comma separated)</label>
          <input
            type="text"
            name="pairs_with"
            value={formData.pairs_with.join(',')}
            onChange={handlePairsWithChange}
            placeholder="Enter product IDs separated by commas"
          />
        </div>

        <div className={styles.variants}>
          <h4>Variants</h4>
          {formData.variants.map((variant, idx) => (
            <div key={idx} className={styles.variantRow}>
              <input type="text" placeholder="Size" value={variant.size} onChange={(e) => handleVariantChange(idx, 'size', e.target.value)} />
              <input type="text" placeholder="Color" value={variant.color} onChange={(e) => handleVariantChange(idx, 'color', e.target.value)} />
              <input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={handleAddVariant}>+ Add Variant</button>
        </div>

        <div className={styles.specs}>
          <h4>Specifications</h4>
          {formData.specifications.map((spec, idx) => (
            <div key={idx} className={styles.specRow}>
              <input type="text" placeholder="Key" value={spec.key} onChange={(e) => handleSpecificationChange(idx, 'key', e.target.value)} />
              <input type="text" placeholder="Value" value={spec.value} onChange={(e) => handleSpecificationChange(idx, 'value', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={handleAddSpecification}>+ Add Specification</button>
        </div>

        <div className={styles.upload}>
          <h4>Upload New Images</h4>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
        </div>

        <div className={styles.imagePreview}>
          <h4>Existing Images</h4>
          <div className={styles.imagesGrid}>
            {formData.images.map((url, idx) => (
              <img key={idx} src={url.startsWith('http') ? url : `http://localhost:5000/${url}`} alt={`Product ${idx}`} />
            ))}
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>Update Product</button>
      </form>
    </div>
  );
};

export default EditProduct;
