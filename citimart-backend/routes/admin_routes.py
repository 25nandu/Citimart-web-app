from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import vendors_collection, products_collection, users_collection, orders_collection
from utils.email_utils import send_email
import random, string
from config import FRONTEND_URL
from datetime import datetime, timedelta

admin_bp = Blueprint("admin", __name__)

# ✅ Helper function to send approval email with tree structure
def send_vendor_approval_email(vendor_email, vendor_name, reset_token,
                               approved_categories, approved_subcategories, approved_childcategories):
    categories_text = ""

    for cat in approved_categories:
        categories_text += f"\n{cat}"
        subcats = approved_subcategories.get(cat, [])

        for sub in subcats:
            children = approved_childcategories.get(sub, [])
            if children:
                categories_text += f"\n ├── {sub} → {', '.join(children)}"
            else:
                categories_text += f"\n ├── {sub}"

    link = f"{FRONTEND_URL}/set-password/{reset_token}"
    email_body = f"""
Hi {vendor_name},

🎉 Congratulations! Your vendor account has been APPROVED ✅

✅ Approved Categories:
{categories_text}

👉 Set your password here: {link}

Welcome to Citimart Vendor Panel 🚀
"""

    send_email(vendor_email, "Vendor Account Approved - Set Your Password", email_body)

# ✅ Get pending vendor applications
@admin_bp.route("/vendor-applications", methods=["GET"])
def get_pending_vendors():
    pending = list(vendors_collection.find({"status": "pending"}))
    for v in pending:
        v["_id"] = str(v["_id"])
    return jsonify(pending), 200

# ✅ Approve vendor with categories + email
@admin_bp.route("/approve-vendor/<vendor_id>", methods=["POST"])
def approve_vendor(vendor_id):
    data = request.get_json() or {}
    approved_categories = data.get("approvedCategories", [])
    approved_subcategories = data.get("approvedSubcategories", {})
    approved_childcategories = data.get("approvedChildcategories", {})

    vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    reset_token = "".join(random.choices(string.ascii_letters + string.digits, k=32))
    expiry_time = datetime.utcnow() + timedelta(days=7)

    vendors_collection.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": {
            "status": "approved",
            "reset_token": reset_token,
            "reset_token_expiry": expiry_time,
            "approved_categories": approved_categories,
            "approved_subcategories": approved_subcategories,
            "approved_childcategories": approved_childcategories
        }}
    )

    send_vendor_approval_email(
        vendor_email=vendor["email"],
        vendor_name=vendor.get("fullName", "Vendor"),
        reset_token=reset_token,
        approved_categories=approved_categories,
        approved_subcategories=approved_subcategories,
        approved_childcategories=approved_childcategories
    )

    return jsonify({"message": "Vendor approved and email sent"}), 200

# ✅ Reject vendor
@admin_bp.route("/reject-vendor/<vendor_id>", methods=["POST"])
def reject_vendor(vendor_id):
    result = vendors_collection.update_one(
        {"_id": ObjectId(vendor_id)}, {"$set": {"status": "rejected"}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify({"message": "Vendor rejected"}), 200

# ✅ Get approved vendors (with product count)
@admin_bp.route("/approved-vendors", methods=["GET"])
def get_approved_vendors():
    approved = list(vendors_collection.find({"status": "approved"}))
    for v in approved:
        v["_id"] = str(v["_id"])
        v["product_count"] = products_collection.count_documents({"vendor_id": v["_id"]})
        v["approved_categories"] = v.get("approved_categories", [])
        v["approved_subcategories"] = v.get("approved_subcategories", {})
        v["approved_childcategories"] = v.get("approved_childcategories", {})
    return jsonify(approved), 200

# ✅ Get products of a specific vendor
@admin_bp.route("/vendor-products/<vendor_id>", methods=["GET"])
def get_vendor_products(vendor_id):
    products = list(products_collection.find({"vendor_id": vendor_id}))
    for p in products:
        p["_id"] = str(p["_id"])
    return jsonify(products), 200

# ✅ Update vendor categories (for editing approved vendors)
'''
@admin_bp.route("/update-vendor/<vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    try:
        data = request.get_json() or {}
        approved_categories = data.get("approvedCategories", [])
        approved_subcategories = data.get("approvedSubcategories", {})
        approved_childcategories = data.get("approvedChildcategories", {})

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {
                "approved_categories": approved_categories,
                "approved_subcategories": approved_subcategories,
                "approved_childcategories": approved_childcategories
            }}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"success": True, "message": "Vendor updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
'''
@admin_bp.route("/update-vendor/<vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    try:
        data = request.get_json() or {}

        approved_categories = data.get("approvedCategories", [])
        approved_subcategories = data.get("approvedSubcategories", {})
        approved_childcategories = data.get("approvedChildcategories", {})
        restricted_until = data.get("restrictedUntil")  # frontend sends camelCase

        update_data = {
            "approved_categories": approved_categories,
            "approved_subcategories": approved_subcategories,
            "approved_childcategories": approved_childcategories
        }

        # ✅ Add restriction date handling
        if restricted_until:
            update_data["restricted_until"] = restricted_until
        else:
            update_data["restricted_until"] = None  # remove restriction if empty

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"success": True, "message": "Vendor updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

#  Restrict vendor until a specific date
@admin_bp.route("/restrict-vendor/<vendor_id>", methods=["PUT"])
def restrict_vendor(vendor_id):
    try:
        data = request.get_json() or {}
        restricted_until = data.get("restricted_until")  # Expecting "YYYY-MM-DD"

        if not restricted_until:
            return jsonify({"error": "restricted_until date is required"}), 400

        # Validate date format
        try:
            datetime.strptime(restricted_until, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {"restricted_until": restricted_until}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"success": True, "message": "Vendor restriction updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


#  Get rejected vendors
@admin_bp.route("/rejected-vendors", methods=["GET"])
def get_rejected_vendors():
    rejected = list(vendors_collection.find({"status": "rejected"}))
    for v in rejected:
        v["_id"] = str(v["_id"])
    return jsonify(rejected), 200

# ✅ Delete vendor
@admin_bp.route("/delete-vendor/<vendor_id>", methods=["DELETE"])
def delete_vendor(vendor_id):
    result = vendors_collection.delete_one({"_id": ObjectId(vendor_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify({"message": "Vendor deleted successfully"}), 200


@admin_bp.route("/vendor-category-requests/<vendor_id>", methods=["GET"])
def get_vendor_category_requests(vendor_id):
    try:
        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        requests = vendor.get("pending_category_requests", [])
        return jsonify(requests), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@admin_bp.route("/approve-category-request/<vendor_id>", methods=["POST"])
def approve_category_request(vendor_id):
    try:
        data = request.json
        category = data.get("category")
        subcategory = data.get("subcategory")
        child_category = data.get("child_category")

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        # ✅ Add to approved lists
        approved_categories = vendor.get("approved_categories", [])
        approved_subcategories = vendor.get("approved_subcategories", {})
        approved_childcategories = vendor.get("approved_childcategories", {})

        if category not in approved_categories:
            approved_categories.append(category)

        if subcategory:
            approved_subcategories.setdefault(category, [])
            if subcategory not in approved_subcategories[category]:
                approved_subcategories[category].append(subcategory)

        if child_category:
            approved_childcategories.setdefault(subcategory, [])
            if child_category not in approved_childcategories[subcategory]:
                approved_childcategories[subcategory].append(child_category)

        # ✅ Remove from pending requests
        updated_requests = [
            r for r in vendor.get("pending_category_requests", [])
            if not (r["category"] == category and
                    r["subcategory"] == subcategory and
                    r["child_category"] == child_category)
        ]

        vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {
                "approved_categories": approved_categories,
                "approved_subcategories": approved_subcategories,
                "approved_childcategories": approved_childcategories,
                "pending_category_requests": updated_requests
            }}
        )

        return jsonify({"message": "Category approved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500    


# ✅ Get all users
'''
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    users = users_collection.find({"role": {"$in": ["customer", "vendor"]}})
    user_list = []
    for user in users:
        created_at = user["_id"].generation_time.strftime("%Y-%m-%d")
        user_list.append({
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "status": "Active" if user.get("is_active", True) else "Inactive",
            "joinDate": created_at,
            "orders": user.get("orders_count", 0)
        })
    return jsonify({"users": user_list}), 200
'''
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    users_cursor = users_collection.find({"role": {"$in": ["customer", "vendor"]}})
    users_list = []

    for user in users_cursor:
        user_id = user["_id"]
        order_count = orders_collection.count_documents({"customer_id": str(user_id)})

        users_list.append({
            "id": str(user_id),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "status": "Active" if user.get("is_active", True) else "Inactive",
            "joinDate": user_id.generation_time.strftime("%Y-%m-%d"),
            "orders": order_count
        })

    return jsonify({"users": users_list}), 200


# ✅ Delete user
@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted successfully"}), 200
    return jsonify({"message": "User not found"}), 404


# ✅ Update user
@admin_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "email" in data:
        update_fields["email"] = data["email"]
    if "is_active" in data:
        update_fields["is_active"] = data["is_active"]

    result = users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    if result.matched_count == 1:
        return jsonify({"message": "User updated successfully"}), 200
    return jsonify({"message": "User not found"}), 404


#  Get all orders (admin only)
'''
@admin_bp.route("/orders", methods=["GET"])
def get_admin_orders():
    orders = list(orders_collection.find().sort("created_at", -1))
    result = []

    for order in orders:
        customer = users_collection.find_one({"_id": ObjectId(order["customer_id"])})
        customer_name = customer.get("name", "Unknown") if customer else "Unknown"

        products = []
        for item in order.get("order_items", []):
            if item.get("added_by", "admin") == "admin":
                products.append({
                    "name": item.get("name", "Product"),
                    "qty": item.get("quantity", 1),
                    "size": item.get("size", "N/A"),
                    "price": item.get("price", 0),
                    "images": [item.get("image", "https://via.placeholder.com/100")]
                })

        if not products:
            continue

        result.append({
            "_id": str(order["_id"]),
            "order_id": str(order["_id"])[:8],
            "customer_name": customer_name,
            "phone": order.get("phone", "N/A"),
            "address": order.get("address", "N/A"),
            "date": order.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M"),
            "products": products,
            "total": order.get("final_amount") or order.get("total_amount", 0),
            "payment": order.get("payment_method", "N/A"),
            "status": order["status"]
        })

    return jsonify(result), 200
'''
@admin_bp.route("/orders", methods=["GET"])
def get_admin_orders():
    orders = list(orders_collection.find().sort("created_at", -1))
    result = []

    for order in orders:
        customer = users_collection.find_one({"_id": ObjectId(order["customer_id"])})
        customer_name = customer.get("name", "Unknown") if customer else "Unknown"

        products = []
        for item in order.get("order_items", []):
            added_by = item.get("added_by", "admin")

            # Admin product
            if added_by == "admin":
                products.append({
                    "name": item.get("name", "Product"),
                    "qty": item.get("quantity", 1),
                    "size": item.get("size", "N/A"),
                    "price": item.get("price", 0),
                    "images": [item.get("image", "https://via.placeholder.com/100")],
                    "added_by": "admin"
                })
                continue

            # Vendor product - always show
            if added_by == "vendor":
                vendor_id = item.get("vendor_id")
                vendor_name = "Unknown Vendor"
                vendor_status = "unknown"

                if vendor_id:
                    vendor = users_collection.find_one({"_id": ObjectId(vendor_id)})
                    if vendor:
                        vendor_name = vendor.get("name", vendor_name)
                        vendor_status = vendor.get("status", vendor_status)

                products.append({
                    "name": item.get("name", "Product"),
                    "qty": item.get("quantity", 1),
                    "size": item.get("size", "N/A"),
                    "price": item.get("price", 0),
                    "images": [item.get("image", "https://via.placeholder.com/100")],
                    "added_by": "vendor",
                    "vendor_name": vendor_name,
                    "vendor_status": vendor_status
                })

        # Even if no products, don't skip — might be useful for tracking
        if not products:
            continue

        result.append({
            "_id": str(order["_id"]),
            "order_id": str(order["_id"])[:8],
            "customer_name": customer_name,
            "phone": order.get("phone", "N/A"),
            "address": order.get("address", "N/A"),
            "date": order.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M"),
            "products": products,
            "total": order.get("final_amount") or order.get("total_amount", 0),
            "payment": order.get("payment_method", "N/A"),
            "status": order.get("status", "N/A")
        })

    return jsonify(result), 200


# ✅ Delete order
@admin_bp.route("/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    result = orders_collection.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order deleted successfully"}), 200


# ✅ Update order
@admin_bp.route("/orders/<order_id>", methods=["PUT"])
def update_order(order_id):
    data = request.json
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    result = orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"message": f"Order status updated to {new_status}"}), 200


