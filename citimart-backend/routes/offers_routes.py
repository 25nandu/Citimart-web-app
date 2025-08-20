print("✅ offers_routes.py started")

import os
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from werkzeug.utils import secure_filename
from database import offers_collection, users_collection, products_collection
from utils.auth_utils import token_required

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

offers_bp = Blueprint("offers", __name__)

# ✅ Serialize offer with product details
def serialize_offer(offer):
    offer["_id"] = str(offer["_id"])

    if "products" not in offer or not isinstance(offer["products"], list):
        offer["products"] = []

    product_details = []
    for pid in offer.get("products", []):
        try:
            product = products_collection.find_one({"_id": ObjectId(pid)})
            if product:
                product_details.append({
                    "id": str(product["_id"]),
                    "name": product.get("name"),
                    "image": product.get("images", [None])[0]
                })
        except:
            pass

    offer["products"] = product_details

    # ✅ Build correct image URL
    if offer.get("image"):
        offer["image"] = f"http://localhost:5000/static/uploads/{offer['image']}"
    else:
        offer["image"] = None

    return offer


def update_offer_status():
    now = datetime.utcnow()
    offers_collection.update_many({"end_date": {"$lt": now}}, {"$set": {"status": "expired"}})
    offers_collection.update_many({"start_date": {"$gt": now}}, {"$set": {"status": "upcoming"}})
    offers_collection.update_many(
        {"start_date": {"$lte": now}, "end_date": {"$gte": now}},
        {"$set": {"status": "active"}}
    )


# ✅ Get Active Offers
@offers_bp.route("/offers", methods=["GET"])
def get_active_offers():
    update_offer_status()
    offers = list(offers_collection.find({"status": "active"}))
    return jsonify([serialize_offer(o) for o in offers]), 200


# ✅ Get All Offers (Admin)
@offers_bp.route("/offers/all", methods=["GET"])
@token_required
def get_all_offers(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    update_offer_status()
    offers = list(offers_collection.find())
    return jsonify([serialize_offer(o) for o in offers]), 200


# 🔹 Extract form/json data
def extract_offer_data():
    if request.form:  # FormData
        data = {key: request.form.get(key) for key in request.form}
        products = request.form.getlist("products[]")
    else:  # JSON
        data = request.json or {}
        products = data.get("products", [])

    # Convert products to ObjectId
    product_ids = []
    for pid in products:
        try:
            product_ids.append(ObjectId(pid))
        except:
            pass

    # ✅ File upload handling
    image_url = None
    if "image" in request.files:
        file = request.files["image"]
        if file and file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # ✅ Save only relative path without "static/"
            image_url = filename

    # Convert dates
    try:
        start_date = datetime.fromisoformat(data.get("start_date"))
    except:
        start_date = datetime.utcnow()

    try:
        end_date = datetime.fromisoformat(data.get("end_date"))
    except:
        end_date = datetime.utcnow()

    return {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "discount": float(data.get("discount") or 0),
        "type": data.get("type", "popup"),
        "min_purchase": float(data.get("min_purchase") or 0),
        "eligible_users": data.get("eligible_users", "all"),
        "personalized_for": data.get("personalized_for", ""),
        "start_date": start_date,
        "end_date": end_date,
        "products": product_ids,
        "image": image_url,
        "status": "upcoming",
        "created_at": datetime.utcnow(),
    }


# ✅ Create Offer
@offers_bp.route("/offers", methods=["POST"])
@token_required
def create_offer(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    try:
        offer_data = extract_offer_data()
        result = offers_collection.insert_one(offer_data)
        offer_data["_id"] = str(result.inserted_id)
        return jsonify(serialize_offer(offer_data)), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


# ✅ Update Offer
@offers_bp.route("/offers/<offer_id>", methods=["PUT"])
@token_required
def update_offer(current_user, offer_id):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    try:
        offer_data = extract_offer_data()
        offer_data.pop("created_at", None)

        offers_collection.update_one({"_id": ObjectId(offer_id)}, {"$set": offer_data})
        updated_offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        return jsonify(serialize_offer(updated_offer)), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


# ✅ Delete Offer
@offers_bp.route("/offers/<offer_id>", methods=["DELETE"])
@token_required
def delete_offer(current_user, offer_id):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    offers_collection.delete_one({"_id": ObjectId(offer_id)})
    return jsonify({"success": True, "message": "Offer deleted"}), 200


# ✅ Apply Offer at Checkout
@offers_bp.route("/offers/checkout-apply", methods=["POST"])
def apply_offer_checkout():
    data = request.json or {}
    total_amount = data.get("total_amount", 0)
    now = datetime.utcnow()

    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    applicable_offers = [serialize_offer(o) for o in offers if total_amount >= o.get("min_purchase", 0)]
    return jsonify({"applicable_offers": applicable_offers}), 200


# ✅ Notify Users Before Big Sale
@offers_bp.route("/offers/notify", methods=["POST"])
@token_required
def notify_users(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    now = datetime.utcnow()
    upcoming_offers = list(offers_collection.find({
        "start_date": {"$gte": now},
        "status": "upcoming"
    }))

    for offer in upcoming_offers:
        users = list(users_collection.find({"role": "customer"}))
        for user in users:
            print(f"📩 Email to {user['email']} → Big Sale: {offer['title']}")

    return jsonify({"message": "Users notified about upcoming sales"}), 200


# ✅ Wishlist Price Drop Notification
@offers_bp.route("/offers/wishlist-drop", methods=["POST"])
def wishlist_price_drop():
    product_id = request.json.get("product_id")
    new_price = request.json.get("new_price")

    wishlists = list(users_collection.find({"wishlist.product_id": product_id}))
    for user in wishlists:
        print(f"📩 Notify {user['email']} → Wishlist item price dropped to ₹{new_price}")

    return jsonify({"message": "Wishlist users notified"}), 200


# ✅ Referral Reward
@offers_bp.route("/offers/referral", methods=["POST"])
def referral_reward():
    data = request.json
    referrer = users_collection.find_one({"_id": ObjectId(data["referrer_id"])})
    referred = users_collection.find_one({"email": data["referred_email"]})

    if referrer and referred:
        print(f"🎁 {referrer['name']} and {referred['name']} earned 200 super coins!")
        return jsonify({"message": "Referral reward granted"}), 200
    return jsonify({"error": "Invalid referral"}), 400

'''
@offers_bp.route("/offers/<offer_id>/products", methods=["GET"])
def get_offer_products(offer_id):
    try:
        offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        if not offer:
            return jsonify([]), 200

        product_ids = offer.get("products", [])
        products = list(products_collection.find({"_id": {"$in": product_ids}}))

        for p in products:
            p["_id"] = str(p["_id"])
            if "images" in p and p["images"]:
                p["images"] = [f"/uploads/{img}" for img in p["images"]]

        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
        '''
@offers_bp.route("/offers/<offer_id>/products", methods=["GET"])
def get_offer_products(offer_id):
    try:
        offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        if not offer:
            return jsonify([]), 200

        product_ids = offer.get("products", [])
        products = list(products_collection.find({"_id": {"$in": product_ids}}))

        serialized_products = []
        for p in products:
            serialized_products.append({
                "id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "images": [
                    img if img.startswith("http") else f"http://localhost:5000/static/uploads/{img}"
                    for img in p.get("images", [])
                ]
            })

        return jsonify(serialized_products), 200
    except Exception as e:
        print("Error fetching offer products:", e)
        return jsonify({"error": str(e)}), 400

