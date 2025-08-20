from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from config import MONGO_URI

# --- Mongo connection ---
client = MongoClient(MONGO_URI)
db = client["citimart_db"]

users_collection = db["users"]
vendors_collection = db["vendors"]
orders_collection = db["orders"]

admin_dashboard_bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/admin")

# ---------- Helpers ----------
def parse_limit(default_val=10, max_val=100):
    try:
        n = int(request.args.get("limit", default_val))
        return max(1, min(n, max_val))
    except Exception:
        return default_val

def parse_since(param="since"):
    val = request.args.get(param)
    if not val:
        return None
    try:
        return datetime.strptime(val, "%Y-%m-%d")
    except Exception:
        return None

def fix_image_url(image_path):
    if not image_path:
        return "http://localhost:5000/static/default-product.jpg"
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return image_path
    return f"http://localhost:5000{image_path}"

# ---------- 1) New Users ----------
@admin_dashboard_bp.route("/users/new", methods=["GET"])
@cross_origin()
def users_new():
    limit = parse_limit(10, 100)
    since = parse_since("since")
    query = {}
    if since:
        query["created_at"] = {"$gte": since}
    cursor = users_collection.find(query).sort([("created_at", DESCENDING), ("_id", DESCENDING)]).limit(limit)
    names = [u.get("name") or u.get("full_name") or u.get("email", "") for u in cursor if u]
    return jsonify({"data": names})

# ---------- 2) Active Vendors ----------
@admin_dashboard_bp.route("/vendors/active", methods=["GET"])
@cross_origin()
def vendors_active():
    limit = parse_limit(10, 100)
    query = {"status": {"$regex": "^approved$", "$options": "i"}}
    cursor = vendors_collection.find(query).sort([("_id", DESCENDING)]).limit(limit)
    business_names = [v.get("businessName", "No Name") for v in cursor]
    return jsonify({"data": business_names})

# ---------- 3) Best Seller Items ----------
@admin_dashboard_bp.route("/dashboard/best-items", methods=["GET"])
@cross_origin()
def best_seller_items():
    limit = parse_limit(5, 50)
    cursor = orders_collection.aggregate([
        {"$unwind": "$order_items"},
        {"$group": {"_id": "$order_items.name", "total_sold": {"$sum": "$order_items.quantity"}}},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit}
    ])
    items = [{"name": doc["_id"], "sold": doc["total_sold"]} for doc in cursor if doc.get("_id")]
    return jsonify({"data": items})

# ---------- 4) Latest Orders ----------
def serialize_order(order):
    return {
        "order_id": str(order["_id"]), 
        "customer_id": str(order.get("customer_id")),
        "customer_name": get_customer_name(order.get("customer_id")),
        "order_items": [
            {
                "product_id": item.get("product_id"),
                "name": item.get("name"),
                "image":fix_image_url(item.get("image")),  
                "size": item.get("size"),
                "quantity": int(item.get("quantity", 0)),   # ✅ clean int
                "price": float(item.get("price", 0)),       # ✅ clean float
                "added_by": item.get("added_by"),
                "vendor_id": str(item.get("vendor_id")) if item.get("vendor_id") else None
            } for item in order.get("order_items", [])
        ],
        "total_amount": float(order.get("total_amount", 0)),
        "discount_applied": int(order.get("discount_applied", 0)),
        "final_amount": float(order.get("final_amount", 0)),
        "applied_offer": order.get("applied_offer"),
        "phone": order.get("phone"),
        "address": order.get("address"),
        "payment_method": order.get("payment_method"),
        "status": order.get("status"),
        "created_at": (
            order["created_at"].isoformat() 
            if isinstance(order.get("created_at"), datetime) 
            else str(order.get("created_at"))
        )
    }

def get_customer_name(customer_id):
    if not customer_id:
        return "Unknown"
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    return customer.get("name", "Unknown") if customer else "Unknown"


# --- API route: latest orders for admin dashboard ---
@admin_dashboard_bp.route("/admin/latest-orders", methods=["GET"])
def get_latest_orders():
    try:
        limit = int(request.args.get("limit", 10))  # default 10
        orders = list(orders_collection.find().sort("created_at", -1).limit(limit))
        serialized_orders = [serialize_order(order) for order in orders]
        return jsonify(serialized_orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- 5) Users Roles Summary ----------
@admin_dashboard_bp.route("/users/roles", methods=["GET"])
@cross_origin()
def users_roles_summary():
    data = list(users_collection.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "name": "$_id", "count": 1}}
    ]))
    return jsonify({"data": data})

# ---------- 6) Vendors Status Summary ----------
@admin_dashboard_bp.route("/vendors/status", methods=["GET"])
@cross_origin()
def vendors_status_summary():
    data = list(vendors_collection.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "name": "$_id", "count": 1}}
    ]))
    return jsonify({"data": data})

