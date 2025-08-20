from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from werkzeug.security import generate_password_hash
from database import vendors_collection ,products_collection,orders_collection,users_collection
from utils.email_utils import send_email
from config import FRONTEND_URL
from utils.auth_utils import token_required
from database import reviews_collection
from werkzeug.utils import secure_filename
import os, json, uuid


vendor_bp = Blueprint('vendor', __name__)

# Vendor Registration (pending approval)
@vendor_bp.route('/register', methods=['POST'])
def register_vendor():
    data = request.json
    if vendors_collection.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    vendor = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "business_name": data["business_name"],
        "status": "pending",
        "created_at": data.get("created_at"),
        "password": None,
        "reset_token": None
    }
    vendors_collection.insert_one(vendor)
    return jsonify({"message": "Application submitted, awaiting approval"}), 201

# Password Setup after Approval (link from email)
@vendor_bp.route('/set-password/<token>', methods=['POST'])
def set_password(token):
    data = request.json
    password = data["password"]

    vendor = vendors_collection.find_one({"reset_token": token, "status": "approved"})
    if not vendor:
        return jsonify({"error": "Invalid or expired link"}), 400

    hashed_password = generate_password_hash(password)
    vendors_collection.update_one(
        {"_id": vendor["_id"]},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": ""}}
    )
    return jsonify({"message": "Password set successfully. You can now login."}), 200


#------ Vendor added Products ---------
'''
UPLOAD_FOLDER = os.path.join("static", "uploads", "products")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
@vendor_bp.route("/add-product", methods=["POST"])
@token_required
def add_product(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Get form fields
    name = request.form.get("name")
    brand = request.form.get("brand")
    price = request.form.get("price")
    discount = request.form.get("discount", 0)
    description = request.form.get("description", "")
    category = request.form.get("category")
    subcategory = request.form.get("subcategory")
    childcategory = request.form.get("childcategory")  # New field

    specifications = json.loads(request.form.get("specifications", "[]"))
    variants = json.loads(request.form.get("variants", "[]"))
    

    # Parse pairs_with JSON string from form
    pairs_with_json = request.form.get("pairs_with", "[]")
    try:
        pairs_with = json.loads(pairs_with_json)
    except Exception:
        pairs_with = []

        

    # Check vendor permissions
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403
        
         # -------- Add pairs_with parsing and validation here --------
    pairs_with_json = request.form.get("pairs_with", "[]")
    try:
        pairs_with = json.loads(pairs_with_json)
    except Exception:
        pairs_with = []

    valid_pairs_with = []
    for pid in pairs_with:
        try:
            prod = products_collection.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if not prod:
            continue
        # Check if pair product is in allowed categories/subcategories/childcategories
        prod_cat = prod.get("category")
        prod_subcat = prod.get("subcategory")
        prod_childcat = prod.get("childcategory")

        if prod_cat in approved_categories:
            if prod_subcat in approved_subcategories.get(prod_cat, []):
                allowed_childcats = approved_childcategories.get(prod_subcat, [])
                if not prod_childcat or prod_childcat in allowed_childcats:
                    valid_pairs_with.append(pid)

    pairs_with = valid_pairs_with  

    # Upload images
    image_urls = []
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(UPLOAD_FOLDER, unique_name))
                image_urls.append(f"/static/uploads/products/{unique_name}")

    # Save product
    product = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,  # Save childcategory
        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": pairs_with,    # Add this line
        "added_by": "vendor",
        "vendor_id": str(current_vendor["_id"]),
        "created_at": datetime.utcnow(),
    }

    products_collection.insert_one(product)

    return jsonify({"success": True, "message": "Product added successfully"}), 201
'''
UPLOAD_FOLDER = os.path.join("static", "uploads", "products")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@vendor_bp.route("/add-product", methods=["POST"])
@token_required
def add_product(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Get form fields
    name = request.form.get("name")
    brand = request.form.get("brand")
    price = request.form.get("price")
    discount = request.form.get("discount", 0)
    description = request.form.get("description", "")
    category = request.form.get("category")
    subcategory = request.form.get("subcategory")
    childcategory = request.form.get("childcategory")  # New field

    specifications = json.loads(request.form.get("specifications", "[]"))
    variants = json.loads(request.form.get("variants", "[]"))

    # Check vendor permissions
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    # -------- Parse pairs_with JSON string and validate --------
    pairs_with_json = request.form.get("pairs_with", "[]")
    try:
        pairs_with = json.loads(pairs_with_json)
    except Exception:
        pairs_with = []

    valid_pairs_with = []
    for pid in pairs_with:
        try:
            prod = products_collection.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if not prod:
            continue
        # Check if pair product is in allowed categories/subcategories/childcategories
        prod_cat = prod.get("category")
        prod_subcat = prod.get("subcategory")
        prod_childcat = prod.get("childcategory")

        if prod_cat in approved_categories:
            if prod_subcat in approved_subcategories.get(prod_cat, []):
                allowed_childcats = approved_childcategories.get(prod_subcat, [])
                if not prod_childcat or prod_childcat in allowed_childcats:
                    valid_pairs_with.append(pid)

    pairs_with = valid_pairs_with
    # -----------------------------------------------------------

    # Upload images
    image_urls = []
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(UPLOAD_FOLDER, unique_name))
                image_urls.append(f"/static/uploads/products/{unique_name}")

    # Save product
    product = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,  # Save childcategory
        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": pairs_with,    # Save validated pairs_with
        "added_by": "vendor",
        "vendor_id": str(current_vendor["_id"]),
        "status": "active", 
        "created_at": datetime.utcnow(),
    }

    products_collection.insert_one(product)

    return jsonify({"success": True, "message": "Product added successfully"}), 201


# ===========================
# Request New Category
# ===========================
@vendor_bp.route("/request-category", methods=["POST"])
@token_required
def request_category(current_user):
    try:
        data = request.get_json()
        category_name = data.get("category")
        subcategory_name = data.get("subcategory")
        child_category_name = data.get("child_category")

        if not category_name:
            return jsonify({"error": "Category name is required"}), 400

        # Create new category with status pending
        vendors_collection.insert_one(
            {
                "name": category_name,
                "subcategories": [],
                "status": "pending",
                "requested_by": current_user["_id"],
                "requested_at": datetime.utcnow(),
            }
        )
        return jsonify({"message": "Category request sent to admin"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ✅ Update own product
@vendor_bp.route("/update-product/<product_id>", methods=["PUT"])
@token_required
def update_product(current_vendor, product_id):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    product = products_collection.find_one({"_id": ObjectId(product_id), "vendor_id": str(current_vendor["_id"])})
    if not product:
        return jsonify({"error": "Product not found or you don't have permission"}), 404

    data = request.form.to_dict()  # Use form for file uploads; or request.json for JSON body

    # Parse fields, fallback to existing if not provided
    name = data.get("name", product.get("name"))
    brand = data.get("brand", product.get("brand"))
    price = data.get("price", product.get("price"))
    discount = data.get("discount", product.get("discount"))
    description = data.get("description", product.get("description"))
    category = data.get("category", product.get("category"))
    subcategory = data.get("subcategory", product.get("subcategory"))
    childcategory = data.get("childcategory", product.get("childcategory"))

    # Parse JSON fields
    try:
        specifications = json.loads(data.get("specifications", json.dumps(product.get("specifications", []))))
    except Exception:
        specifications = product.get("specifications", [])

    try:
        variants = json.loads(data.get("variants", json.dumps(product.get("variants", []))))
    except Exception:
        variants = product.get("variants", [])

    # Check vendor permissions
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    # Parse and validate pairs_with
    pairs_with_json = data.get("pairs_with", None)
    if pairs_with_json is not None:
        try:
            pairs_with = json.loads(pairs_with_json)
        except Exception:
            pairs_with = []

        valid_pairs_with = []
        for pid in pairs_with:
            try:
                prod = products_collection.find_one({"_id": ObjectId(pid)})
            except Exception:
                continue
            if not prod:
                continue
            prod_cat = prod.get("category")
            prod_subcat = prod.get("subcategory")
            prod_childcat = prod.get("childcategory")

            if prod_cat in approved_categories:
                if prod_subcat in approved_subcategories.get(prod_cat, []):
                    allowed_childcats = approved_childcategories.get(prod_subcat, [])
                    if not prod_childcat or prod_childcat in allowed_childcats:
                        valid_pairs_with.append(pid)
    else:
        # If not provided, keep existing pairs_with
        valid_pairs_with = product.get("pairs_with", [])

    # Handle images update if any
    image_urls = product.get("images", [])
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(UPLOAD_FOLDER, unique_name))
                image_urls.append(f"/static/uploads/products/{unique_name}")

    # Prepare update document
    updated_data = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,
        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": valid_pairs_with,
        "updated_at": datetime.utcnow(),
    }

    products_collection.update_one({"_id": ObjectId(product_id)}, {"$set": updated_data})

    return jsonify({"success": True, "message": "Product updated successfully"}), 200



# ✅ Delete own product
@vendor_bp.route("/delete-product/<product_id>", methods=["DELETE"])
@token_required
def delete_product(current_user, product_id):
    if current_user["role"] != "vendor":
        return jsonify({"error": "Access denied"}), 403

    result = products_collection.delete_one({"_id": ObjectId(product_id), "vendor_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({"message": "Product deleted successfully"}), 200

#------- Vendor-Orders -------------------------

@vendor_bp.route('/my-orders', methods=['GET'])
@token_required
def get_vendor_orders(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    orders = list(orders_collection.find({
        "order_items.vendor_id": vendor_id
    }).sort("created_at", -1))

    result = []
    for order in orders:
        vendor_products = [
            item for item in order["order_items"] 
            if item.get("vendor_id") == vendor_id
        ]

        # Get customer name (optional)
        customer = users_collection.find_one({"_id": ObjectId(order.get("customer_id"))})
        customer_name = customer.get("name") if customer else "Unknown"

        result.append({
            "_id": str(order["_id"]),
            "customer_id": order.get("customer_id"),
            "customer_name": customer_name,
            "customer_phone": order.get("phone"),
            "customer_address": order.get("address"),
            "products": vendor_products,
            "vendor_total": sum(item["price"] * item["quantity"] for item in vendor_products),
            "payment": order.get("payment_method", "COD"),
            "status": order.get("status"),
            "date": order.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if order.get("created_at") else ""
        })

    return jsonify({"orders": result}), 200




@vendor_bp.route('/delete-order/<order_id>', methods=['DELETE'])
@token_required
def delete_order(current_vendor, order_id):
    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Allow deletion only if vendor's products exist in the order
    vendor_products = [p for p in order.get("order_items", []) if p.get("vendor_id") == str(current_vendor["_id"])]
    if not vendor_products:
        return jsonify({"error": "You are not authorized to delete this order."}), 403

    orders_collection.delete_one({"_id": ObjectId(order_id)})
    return jsonify({"message": "Order deleted successfully"})



@vendor_bp.route('/update-order/<order_id>', methods=['PUT'])
@token_required
def update_order(current_vendor, order_id):
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Check if this vendor has products in this order
    vendor_products = [p for p in order.get("order_items", []) if p.get("vendor_id") == str(current_vendor["_id"])]
    if not vendor_products:
        return jsonify({"error": "Unauthorized"}), 403

    orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": new_status}})
    return jsonify({"message": "Order status updated to " + new_status})



@vendor_bp.route('/analytics', methods=['GET'])
@token_required
def vendor_analytics(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    products = list(products_collection.find({"vendor_id": vendor_id}))
    orders = list(orders_collection.find({
        "order_items": {"$elemMatch": {"vendor_id": vendor_id}}
    }))

    total_sales = 0
    units_sold = 0
    sales_trend = [0] * 7
    trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for order in orders:
        order_day = order["created_at"].weekday()
        for item in order["order_items"]:
            if str(item["vendor_id"]) == str(vendor_id):
                price = item["price"]
                qty = item["quantity"]
                total_sales += price * qty
                units_sold += qty
                sales_trend[order_day] += price * qty

    top_days = [{"day": trend_labels[i], "sales": sales_trend[i]} for i in range(7) if sales_trend[i] > 0]

    # Product Performance
    top_selling, low_performing, out_of_stock = [], [], []
    total_sold, total_returned = 0, 5  # mock returns

    for product in products:
        sold = sum(
            item["quantity"]
            for order in orders
            for item in order["order_items"]
            if str(item.get("_id")) == str(product["_id"])
        )
        total_sold += sold

        if sold > 10:
            top_selling.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})
        elif sold < 3:
            low_performing.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})

        stock = sum([v.get("stock", 0) for v in product.get("variants", [])])
        if stock == 0:
            out_of_stock.append({"name": product["name"], "stock": 0})

    deductions = total_sales * 0.05
    net_payout = total_sales - deductions

    analytics_data = {
        "salesOverview": {
            "totalSales": total_sales,
            "unitsSold": units_sold,
            "trend": sales_trend,
            "trendLabels": trend_labels,
            "topDays": top_days
        },
        "productPerformance": {
            "topSelling": top_selling,
            "lowPerforming": low_performing,
            "outOfStock": out_of_stock,
            "totalSold": total_sold,
            "totalReturned": total_returned
        },
        "customerInsights": {
            "new": 10,
            "returning": 20,
            "avgOrderValue": total_sales / len(orders) if orders else 0,
            "ratings": 4.5,
            "reviews": reviews_collection.count_documents({"vendor_id": vendor_id}),
            "topLocations": [{"city": "Mumbai", "count": 15}, {"city": "Delhi", "count": 10}]
        },
        "orderAnalytics": {
            "total": len(orders),
            "status": {"pending": 2, "delivered": 15, "canceled": 1, "returned": 1},
            "fulfillmentRate": 95,
            "avgDelivery": 3.2
        },
        "earningsOverview": {
            "total": total_sales,
            "deductions": deductions,
            "netPayout": net_payout,
            "payoutHistory": [
                {"date": "2025-06-01", "amount": 12000, "status": "Paid"},
                {"date": "2025-05-01", "amount": 11000, "status": "Paid"},
            ]
        },
        "returnsComplaints": {
            "reasons": [{"reason": "Size Issue", "count": 2}, {"reason": "Damaged Item", "count": 2}, {"reason": "Wrong Product", "count": 1}],
            "complaints": [{"category": "Late Delivery", "count": 1}, {"category": "Damaged Item", "count": 1}],
            "resolved": 4,
            "pending": 1
        },
        "stockInsights": {
            "totalSKUs": len(products),
            "lowStock": sum(1 for p in products if 0 < sum(v.get("stock", 0) for v in p.get("variants", [])) < 5),
            "outOfStock": len(out_of_stock),
            "restockSuggestions": [{"name": p["name"], "suggestion": "Restock soon"} for p in out_of_stock],
        },
        "marketingEngagement": {
            "adROI": 2.5,
            "promotions": [{"name": "Summer Sale", "performance": "High"}, {"name": "Clearance", "performance": "Medium"}],
            "wishlist": [{"name": "Sneakers", "count": 10}, {"name": "T-Shirt", "count": 10}]
        }
    }

    return jsonify(analytics_data), 200


@vendor_bp.route("/set-password/<reset_token>", methods=["POST"])
def set_vendor_password(reset_token):
    data = request.get_json() or {}
    password = data.get("password")

    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    vendor = vendors_collection.find_one({"reset_token": reset_token})
    if not vendor:
        return jsonify({"success": False, "error": "Invalid or expired token"}), 400

    if vendor.get("reset_token_expiry") and datetime.utcnow() > vendor["reset_token_expiry"]:
        return jsonify({"success": False, "error": "Link expired. Request a new approval link."}), 400

    hashed_password = generate_password_hash(password)
    vendors_collection.update_one(
        {"_id": vendor["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expiry": ""}
        }
    )

    return jsonify({"success": True, "message": "Password set successfully"}), 200

@vendor_bp.route("/profile", methods=["GET"])
@token_required
def get_vendor_profile(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    return jsonify({
        "success": True,
        "email": vendor.get("email"),
        "fullName": vendor.get("name") or vendor.get("fullName"),
        "approved_categories": vendor.get("approved_categories", []),
        "approved_subcategories": vendor.get("approved_subcategories", {}),
        "approved_childcategories": vendor.get("approved_childcategories", {}),
    }), 200

@vendor_bp.route("/my-products", methods=["GET"])
@token_required
def get_my_products(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    products = list(products_collection.find({"vendor_id": str(current_vendor["_id"])}))

    for p in products:
        p["_id"] = str(p["_id"])

    return jsonify({"success": True, "products": products}), 200


@vendor_bp.route("/test-route")
def test_route():
    return "Vendor blueprint works!"
