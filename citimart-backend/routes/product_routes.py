from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
import json
from bson import ObjectId

from database import products_collection

product_bp = Blueprint("products", __name__)

UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# ------------------ Add Product (Admin or Vendor) ------------------
@product_bp.route('/api/products/add', methods=['POST'])
def add_product():
    try:
        name = request.form['name']
        brand = request.form['brand']
        price = float(request.form['price'])
        discount = float(request.form.get('discount', 0))
        description = request.form['description']
        category = request.form['category']
        sub_category = request.form['subCategory']
        child_category = request.form.get('childCategory', "") 
        specifications = json.loads(request.form.get('specifications', '[]'))
        raw_variants = json.loads(request.form.get('variants', '[]'))

        variants = [ {
            "size": v.get("size", ""),
            "color": v.get("color", ""),
            "stock": int(v.get("stock", 0))
        } for v in raw_variants ]

        added_by = request.form.get('added_by', 'admin')
        vendor_id = request.form.get('vendor_id')
        status = request.form.get('status', 'active')
        pairs_with_ids = json.loads(request.form.get("pairs_with", "[]")) 

        # Handle main product images
        image_urls = []
        files = request.files.getlist('images')
        for file in files:
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(path)
            image_urls.append(f"http://localhost:5000/{path}")

        # ✅ Handle 'pairs_with' images
        pairs_with_image_urls = []
        pairs_with_files = request.files.getlist("pairs_with")
        for file in pairs_with_files:
            if file:
                filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                image_url = f"http://localhost:5000/{file_path}"
                pairs_with_image_urls.append(image_url)

        product = {
            "name": name,
            "brand": brand,
            "price": price,
            "discount": discount,
            "description": description,
            "category": category,
            "subCategory": sub_category,
            "childCategory": child_category,
            "specifications": specifications,
            "variants": variants,
            "images": image_urls,
            "pairs_with_images": pairs_with_image_urls, 
            "pairs_with": [ObjectId(pid) for pid in pairs_with_ids],  
            "created_at": datetime.utcnow(),
            "added_by": added_by,
            "status": status
        }

        if vendor_id:
            product["vendor_id"] = vendor_id

        result = products_collection.insert_one(product)
        product_id = str(result.inserted_id)

        return jsonify({
            "message": "Product added successfully",
            "product_id": product_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ Get All Products ------------------
@product_bp.route('/api/products/all', methods=['GET'])
def get_all_products():
    try:
        products = list(products_collection.find().sort("created_at", -1))
        for p in products:
            p['_id'] = str(p['_id'])

            # Convert pairs_with ObjectIds to strings
            if "pairs_with" in p and isinstance(p["pairs_with"], list):
                p["pairs_with"] = [str(pid) for pid in p["pairs_with"]]

        return jsonify({"products": products}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# ------------------ Get Single Product ------------------
'''
import traceback

@product_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product_by_id(product_id):
    try:
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if product:
            product["_id"] = str(product["_id"])

            # Convert ObjectId in pairs_with
            if "pairs_with" in product and isinstance(product["pairs_with"], list):
                product["pairs_with"] = [str(pid) for pid in product["pairs_with"]]

            return jsonify({"product": product}), 200
        return jsonify({"error": "Product not found"}), 404
    except Exception as e:
        traceback.print_exc()  # 🔍 Print full stack trace to terminal
        return jsonify({"error": str(e)}), 500
'''
import traceback
@product_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product_by_id(product_id):
    try:
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify({"error": "Product not found"}), 404

        product["_id"] = str(product["_id"])

        # Convert ObjectId list for pairs_with
        if "pairs_with" in product and isinstance(product["pairs_with"], list):
            product["pairs_with"] = [str(pid) for pid in product["pairs_with"]]

            # Fetch full paired product details
            paired_products = []
            for pid in product["pairs_with"]:
                paired = products_collection.find_one({"_id": ObjectId(pid)}, {
                    "_id": 1,
                    "name": 1,
                    "price": 1,
                    "discount": 1,
                    "images": 1
                })
                if paired:
                    paired["_id"] = str(paired["_id"])
                    
                    # Ensure at least one image is available
                    paired["image"] = paired["images"][0] if paired.get("images") else None
                    
                    # Calculate discounted price
                    original_price = float(paired.get("price", 0))
                    discount = float(paired.get("discount", 0))
                    discounted_price = original_price - (original_price * discount / 100)
                    paired["final_price"] = round(discounted_price, 2)
                    
                    paired_products.append(paired)

            product["pairs_with_products"] = paired_products

        return jsonify({"product": product}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
     

def get_product_with_pairs(product):
    product = dict(product)  # make editable
    pair_ids = product.get("pairs_with", [])
    
    if pair_ids:
        product["pairs_with_products"] = list(products_collection.find(
            {"_id": {"$in": pair_ids}},
            {"name": 1, "price": 1, "discount": 1, "images": 1}
        ))
        
        # Add final_price for each paired product
        for p in product["pairs_with_products"]:
            p["final_price"] = round(
                p["price"] - (p.get("discount", 0) / 100 * p["price"])
            )
            if p.get("images"):
                p["image"] = p["images"][0]
    else:
        product["pairs_with_products"] = []
    
    return product


# ------------------ Update Product ------------------
@product_bp.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        vendor_id = request.form.get('vendor_id')
        is_admin = request.form.get('is_admin') == 'true'

        query = {'_id': ObjectId(product_id)}
        if vendor_id and not is_admin:
            query.update({'vendor_id': vendor_id, 'added_by': 'vendor'})
        elif is_admin:
            query.update({'added_by': 'admin'})
        else:
            return jsonify({'error': 'Access denied'}), 403

        update_fields = {
            "name": request.form.get('name'),
            "description": request.form.get('description'),
            "price": float(request.form.get('price', 0)),
            "category": request.form.get('category'),
            "subCategory": request.form.get('subCategory'),
            "childCategory": request.form.get('childCategory', ""),  # ✅ Added support
            "brand": request.form.get('brand', ''),
            "discount": float(request.form.get('discount', 0)),
            "status": request.form.get('status', 'active'),
            "specifications": json.loads(request.form.get('specifications', '[]')),
            "variants": [
                {
                    "size": v.get("size", ""),
                    "color": v.get("color", ""),
                    "stock": int(v.get("stock", 0))
                }
                for v in json.loads(request.form.get('variants', '[]'))
            ],
            "updated_at": datetime.utcnow()
        }

        # ✅ NEW: update 'pairs_with' field if provided
        pairs_with_ids = json.loads(request.form.get("pairs_with", "[]"))
        update_fields["pairs_with"] = [ObjectId(pid) for pid in pairs_with_ids]

        # ✅ Handle new image uploads (optional)
        image_urls = []
        files = request.files.getlist('images')
        for file in files:
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(path)
            image_urls.append(f"http://localhost:5000/{path}")

        if image_urls:
            update_fields['images'] = image_urls

        result = products_collection.update_one(query, {'$set': update_fields})

        if result.matched_count == 0:
            print(f"[DEBUG] No match found for update. Query: {query}")
            return jsonify({'error': 'Product not found or access denied'}), 404

        return jsonify({'message': 'Product updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------------ Get Full Products by Category/Subcategory/ChildCategory ------------------


@product_bp.route('/api/products/by-category', methods=['GET'])
def get_products_by_category():
    try:
        # Get list values instead of single strings
        categories = request.args.getlist('category')
        subcategories = request.args.getlist('subcategory')
        child_categories = request.args.getlist('child_category')

        query = {}
        if categories:
            query["category"] = {"$in": categories}
        if subcategories:
            query["subCategory"] = {"$in": subcategories}
        if child_categories:
            query["childCategory"] = {"$in": child_categories}

        products_cursor = products_collection.find(query).sort("created_at", -1)

        product_list = []
        for product in products_cursor:
            product['_id'] = str(product['_id'])

            # Resolve pairs_with to product details
            if "pairs_with" in product and isinstance(product["pairs_with"], list):
                paired_ids = [ObjectId(pid) for pid in product["pairs_with"] if ObjectId.is_valid(pid)]
                paired_products_cursor = products_collection.find(
                    {"_id": {"$in": paired_ids}},
                    {"_id": 1, "name": 1, "price": 1, "discount": 1, "stock": 1, "images": 1}
                )
                paired_products = [{
                    "id": str(p["_id"]),
                    "name": p.get("name"),
                    "price": p.get("price"),
                    "discount": p.get("discount"),
                    "stock": p.get("stock"),
                    "images": p.get("images", [])
                } for p in paired_products_cursor]
                product["pairs_with"] = paired_products
            else:
                product["pairs_with"] = []

            product_list.append(product)

        return jsonify({"products": product_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


#----- Frequently bought together section --------------

@product_bp.route('/api/products/frequently-bought/<product_id>', methods=['GET'])
def get_frequently_bought(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        query = {
            "category": product.get("category", ""),
            "subCategory": product.get("subCategory", ""),
            "_id": {"$ne": ObjectId(product_id)}
        }

        # ✅ If childCategory exists, include it too
        if product.get("childCategory"):
            query["childCategory"] = product["childCategory"]

        related = list(products_collection.find(query).limit(5))

        for p in related:
            p["_id"] = str(p["_id"])

        return jsonify({"relatedProducts": related}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ Delete Product ------------------
@product_bp.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        vendor_id = request.args.get('vendor_id')
        is_admin = request.args.get('is_admin') == 'true'

        query = {'_id': ObjectId(product_id)}
        if vendor_id and not is_admin:
            query.update({'vendor_id': vendor_id, 'added_by': 'vendor'})
        elif is_admin:
            query.update({'added_by': 'admin'})
        else:
            return jsonify({'error': 'Access denied'}), 403

        result = products_collection.delete_one(query)

        if result.deleted_count == 1:
            return jsonify({'message': 'Product deleted successfully'}), 200
        else:
            print(f"[DEBUG] Delete failed. Query used: {query}")
            return jsonify({'error': 'Product not found or access denied'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------------ Get All Products by Vendor ------------------
@product_bp.route('/api/products/vendor/<vendor_id>', methods=['GET'])
def get_products_by_vendor(vendor_id):
    try:
        products = list(products_collection.find({
            "vendor_id": vendor_id,
            "added_by": "vendor"
        }).sort("created_at", -1))
        for p in products:
            p['_id'] = str(p['_id'])
        return jsonify({"products": products}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ------------------ Get Product IDs by Category/Subcategory/ChildCategory ------------------
@product_bp.route('/api/products/ids-by-category', methods=['GET'])
def get_product_ids_by_category():
    try:
        category = request.args.get('category')
        subcategory = request.args.get('subcategory')
        child_category = request.args.get('child_category')

        query = {}
        if category:
            query["category"] = category
        if subcategory:
            query["subCategory"] = subcategory
        if child_category:
            query["childCategory"] = child_category

        products = products_collection.find(query, {"_id": 1, "name": 1})
        product_ids = [{"id": str(product["_id"]), "name": product["name"]} for product in products]

        return jsonify({"product_ids": product_ids}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@product_bp.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = list(products_collection.find().sort("created_at", -1))
        for p in products:
            p['_id'] = str(p['_id'])
            if "pairs_with" in p and isinstance(p["pairs_with"], list):
                p["pairs_with"] = [str(pid) for pid in p["pairs_with"]]
        return jsonify({"products": products}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@product_bp.route('/api/products/similar/<product_id>', methods=['GET'])
def get_similar_products(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        query = {
            "category": product.get("category", ""),
            "_id": {"$ne": ObjectId(product_id)}
        }

        similar = list(products_collection.find(query).limit(4))

        for p in similar:
            p['_id'] = str(p['_id'])

        return jsonify({'products': similar}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#http://localhost:5000/api/products/ids-by-category?category=Clothing&subcategory=Women&child_category=Tops