from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime  
import logging
from utils.auth_utils import token_required
from database import (
    users_collection,
    cart_collection,
    wishlist_collection,
    orders_collection,
    offers_collection,
    products_collection,
)

customer_bp = Blueprint("customer", __name__)

# --------------------- CART ---------------------
'''
@customer_bp.route("/cart/<customer_id>", methods=["GET"])
@token_required
def get_cart(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart or "items" not in cart:
        return jsonify({"items": []})

    enriched_items = []

    for item in cart["items"]:
        product_id = item.get("product_id")
        if not product_id:
            continue

        product_id_obj = ObjectId(product_id) if isinstance(product_id, str) else product_id
        product = products_collection.find_one({"_id": product_id_obj})

        if not product:
            continue

        # Prepare pairs_with image previews
        pairs_with_images = []
        for pid in product.get("pairs_with", []):
            try:
                pid_obj = ObjectId(pid) if isinstance(pid, str) else pid
                paired_product = products_collection.find_one({"_id": pid_obj}, {"images": 1})
                if paired_product and paired_product.get("images"):
                    pairs_with_images.append(paired_product["images"][0])  # first image
            except Exception:
                continue

        enriched_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "price": product.get("price"),
                "images": product.get("images", []),
                "pairs_with": [str(pid) for pid in product.get("pairs_with", [])],
                "pairs_with_images": pairs_with_images,
            },
            "size": item.get("size", "N/A"),
            "quantity": item.get("quantity", 1)
        })

    return jsonify({"items": enriched_items})
'''
@customer_bp.route("/cart/<customer_id>", methods=["GET"])
@token_required
def get_cart(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart or "items" not in cart:
        return jsonify({"items": []})

    enriched_items = []

    for item in cart["items"]:
        product_id = item.get("product_id")
        if not product_id:
            continue

        product_id_obj = ObjectId(product_id) if isinstance(product_id, str) else product_id
        product = products_collection.find_one({"_id": product_id_obj})

        if not product:
            continue

        # Convert ObjectId list to string list
        pairs_with_ids = [str(pid) for pid in product.get("pairs_with", [])]

        # Prepare pairs_with image previews
        pairs_with_images = []
        pairs_with_products = []
        for pid in pairs_with_ids:
            try:
                pid_obj = ObjectId(pid)
                paired_product = products_collection.find_one(
                    {"_id": pid_obj},
                    {"name": 1, "price": 1, "discount": 1, "images": 1}
                )
                if paired_product:
                    # Store first image for quick previews
                    if paired_product.get("images"):
                        pairs_with_images.append(paired_product["images"][0])

                    # Calculate discounted price
                    original_price = float(paired_product.get("price", 0))
                    discount = float(paired_product.get("discount", 0))
                    discounted_price = original_price - (original_price * discount / 100)

                    pairs_with_products.append({
                        "_id": str(paired_product["_id"]),
                        "name": paired_product.get("name"),
                        "price": original_price,
                        "discount": discount,
                        "final_price": round(discounted_price, 2),
                        "image": paired_product["images"][0] if paired_product.get("images") else None
                    })
            except Exception:
                continue

        enriched_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "price": product.get("price"),
                "images": product.get("images", []),
                "pairs_with": pairs_with_ids,
                "pairs_with_images": pairs_with_images,
                "pairs_with_products": pairs_with_products  # ✅ full data for frontend
            },
            "size": item.get("size", "N/A"),
            "quantity": item.get("quantity", 1)
        })

    return jsonify({"items": enriched_items})



@customer_bp.route("/cart/add", methods=["POST"])
@token_required
def add_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    quantity = data.get("quantity", 1)

    existing_cart = cart_collection.find_one({"customer_id": customer_id})
    if not existing_cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "quantity": quantity}]
        })
    else:
        items = existing_cart["items"]
        for item in items:
            if item["product_id"] == product_id and item["size"] == size:
                item["quantity"] += quantity
                break
        else:
            items.append({"product_id": product_id, "size": size, "quantity": quantity})
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to cart"})


@customer_bp.route("/cart/clear/<customer_id>", methods=["DELETE"])
@token_required
def clear_cart(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart_collection.delete_one({"customer_id": customer_id})
    return jsonify({"message": "Cart cleared"})


@customer_bp.route("/cart/update_quantity", methods=["POST"])
@token_required
def update_cart_quantity(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    new_quantity = data.get("quantity")

    if new_quantity < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        return jsonify({"error": "Cart not found"}), 404

    updated = False
    for item in cart["items"]:
        if item["product_id"] == product_id and item.get("size") == size:
            item["quantity"] = new_quantity
            updated = True
            break

    if updated:
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": cart["items"]}})
        return jsonify({"message": "Quantity updated"})
    else:
        return jsonify({"error": "Item not found in cart"}), 404


@customer_bp.route("/cart/remove_item", methods=["DELETE"])
@token_required
def remove_item_from_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        return jsonify({"error": "Cart not found"}), 404

    new_items = [item for item in cart["items"] if not (item["product_id"] == product_id and item.get("size") == size)]

    if len(new_items) == len(cart["items"]):
        return jsonify({"error": "Item not found in cart"}), 404

    cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": new_items}})
    return jsonify({"message": "Item removed from cart"})


# --------------------- WISHLIST ---------------------
@customer_bp.route("/wishlist/<customer_id>", methods=["GET"])
@token_required
def get_wishlist(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})
    if not wishlist:
        return jsonify({"items": []})

    enriched_items = []

    for item in wishlist.get("items", []):
        product_id = item.get("product_id")
        if not product_id:
            continue

        # Convert to ObjectId if needed
        if isinstance(product_id, str):
            product_id_obj = ObjectId(product_id)
        else:
            product_id_obj = product_id

        product = products_collection.find_one({"_id": product_id_obj})
        if not product:
            continue

        enriched_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "price": product.get("price"),
                "images": product.get("images", [])
            },
            "size": item.get("size", "N/A")
        })

    return jsonify({"items": enriched_items})



@customer_bp.route("/wishlist/add", methods=["POST"])
@token_required
def add_to_wishlist(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})

    if not wishlist:
        wishlist_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size}]
        })
    else:
        items = wishlist["items"]
        if not any(i["product_id"] == product_id and i["size"] == size for i in items):
            items.append({"product_id": product_id, "size": size})
            wishlist_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to wishlist"})


@customer_bp.route("/wishlist/move_to_cart", methods=["POST"])
@token_required
def move_wishlist_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")
    quantity = data.get("quantity", 1)

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    # Add to cart
    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "quantity": quantity}]
        })
    else:
        items = cart["items"]
        for item in items:
            if item["product_id"] == product_id and item["size"] == size:
                item["quantity"] += quantity
                break
        else:
            items.append({"product_id": product_id, "size": size, "quantity": quantity})
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

   

@customer_bp.route("/wishlist/remove", methods=["DELETE"])
@token_required
def remove_from_wishlist(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})
    if not wishlist:
        return jsonify({"error": "Wishlist not found"}), 404

    updated_items = [item for item in wishlist["items"] if not (item["product_id"] == product_id and item.get("size") == size)]
    wishlist_collection.update_one({"customer_id": customer_id}, {"$set": {"items": updated_items}})
    return jsonify({"message": "Removed from wishlist"})

# --------------------- CHECKOUT ---------------------
@customer_bp.route("/checkout", methods=["POST"])
@token_required
def checkout(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    coupon_code = data.get("coupon_code")
    phone = data.get("phone", "")
    address = data.get("address", "")
    payment_method = data.get("payment_method", "cod")

    # ✅ Fetch Cart
    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart or not cart["items"]:
        return jsonify({"message": "Cart is empty"}), 400

    total = 0
    enriched_items = []

    for item in cart["items"]:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        price = float(product.get("price", 0))
        quantity = int(item.get("quantity", 0))
        total += price * quantity

        images = product.get("images", [])
        image = images[0] if images else "https://via.placeholder.com/100"

        enriched_items.append({
            "product_id": item["product_id"],
            "name": product.get("name", "Product"),
            "image": image,
            "size": item.get("size", "N/A"),
            "quantity": item["quantity"],
            "price": price,
            "added_by": product.get("added_by", "admin"),
            "vendor_id": product.get("vendor_id") if product.get("added_by") == "vendor" else None
        })

    # ✅ Initialize discount
    discount = 0
    applied_offer = None

    # ✅ If coupon/offer code provided
    if coupon_code:
        offer = offers_collection.find_one({"code": coupon_code})
        if offer:
            # 🟢 Flat Discount (₹100 off)
            if offer.get("type") == "flat" and total >= offer.get("min_purchase", 0):
                discount = offer.get("amount", 0)
                applied_offer = offer["title"]

            # 🟢 Percentage Discount (20% off)
            elif offer.get("type") == "percent" and total >= offer.get("min_purchase", 0):
                discount = int((total * offer.get("discount_percent", 0)) / 100)
                applied_offer = offer["title"]

            # 🟢 BOGO (Buy One Get One Free)
            elif offer.get("type") == "bogo":
                for item in cart["items"]:
                    if item["quantity"] >= 2:
                        free_items = item["quantity"] // 2
                        discount += free_items * product.get("price", 0)
                applied_offer = "Buy 1 Get 1 Free"

            # 🟢 Free Shipping
            elif offer.get("type") == "free_shipping":
                applied_offer = "Free Shipping"
                # Free shipping will be applied later

            # 🟢 Flat Price (e.g., ₹399 for Casual Shirt)
            elif offer.get("type") == "flat_price":
                for item in cart["items"]:
                    product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
                    if product and product.get("category") == offer.get("category"):
                        original_price = product.get("price", 0)
                        new_price = offer.get("flat_price", original_price)
                        discount += (original_price - new_price) * item["quantity"]
                applied_offer = f"Flat Price {offer.get('flat_price')}"

    # ✅ Final Amount
    final_total = total - discount

    # ✅ Add Delivery Fee (unless Free Shipping)
    delivery_fee = 0
    if final_total < 500 and (not applied_offer or applied_offer != "Free Shipping"):
        delivery_fee = 50
        final_total += 50

    # ✅ Insert Order
    orders_collection.insert_one({
        "customer_id": customer_id,
        "order_items": enriched_items,
        "total_amount": total,
        "discount_applied": discount,
        "final_amount": final_total,
        "applied_offer": applied_offer,
        "phone": phone,
        "address": address,
        "payment_method": payment_method,
        "status": "Placed",
        "created_at": datetime.utcnow()
    })

    # ✅ Clear Cart After Order
    cart_collection.delete_one({"customer_id": customer_id})

    return jsonify({
        "message": "Order placed successfully",
        "total": total,
        "discount": discount,
        "delivery_fee": delivery_fee,
        "final": final_total,
        "applied_offer": applied_offer
    })






# --------------------- OFFERS ---------------------

@customer_bp.route("/offers", methods=["GET"])
def get_offers():
    now = datetime.utcnow()
    offers = list(offers_collection.find({"valid_till": {"$gte": now}}))
    for o in offers:
        o["_id"] = str(o["_id"])
    return jsonify(offers)


@customer_bp.route("/orders/<customer_id>", methods=["GET"])
@token_required
def get_orders(current_user, customer_id):
    if str(current_user["_id"]) != customer_id:
        return jsonify({"error": "Unauthorized"}), 403

    orders = list(orders_collection.find({"customer_id": customer_id}).sort("created_at", -1))
    enriched_orders = []

    for order in orders:
        if "order_items" not in order:
            continue  # Skip orders without items to prevent KeyError

        enriched_items = []
        for item in order["order_items"]:
            product_id = item.get("product_id")
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)

            product = products_collection.find_one({"_id": product_id})
            if not product:
                continue  # Skip missing products

            enriched_items.append({
                "product": {
                    "_id": str(product["_id"]),
                    "name": product.get("name"),
                    "price": product.get("price"),
                    "images": product.get("images", [])
                },
                "size": item.get("size"),
                "quantity": item.get("quantity")
            })

        enriched_orders.append({
            "_id": str(order["_id"]),
            "products": enriched_items,
            "total": order.get("total_amount"),
            "discount": order.get("discount_applied", 0),
            "final": order.get("final_amount"),
            "address": order.get("address", ""),
            "payment_method": order.get("payment_method", ""),
            "status": order.get("status"),
            "created_at": order.get("created_at")
        })

    return jsonify(enriched_orders)


@customer_bp.route('/profile/<customer_id>', methods=['GET'])
@token_required
def get_customer_profile(current_user, customer_id):
    if current_user["role"] != "customer":
        return jsonify({"error": "Access denied"}), 403

    if str(current_user["_id"]) != customer_id:
        return jsonify({"error": "Unauthorized"}), 403

    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    return jsonify({
        "fullName": customer.get("name") or customer.get("fullName"),
        "email": customer.get("email"),
        "phone": customer.get("phone")
    }), 200

@customer_bp.route("/cart/similar/<customer_id>", methods=["GET"])
def get_similar_products(customer_id):
    try:
        cart_doc = cart_collection.find_one({"customer_id": customer_id})
        if not cart_doc or not cart_doc.get("items"):
            return jsonify({"similar_products": []})

        cart_items = cart_doc["items"]
        product_ids = [item["product_id"] for item in cart_items if "product_id" in item]

        # Get all product documents in the cart
        cart_products = list(products_collection.find({"_id": {"$in": [ObjectId(pid) for pid in product_ids]}}))

        # Collect unique categories or brands
        categories = set()
        brands = set()
        for product in cart_products:
            if "category" in product:
                categories.add(product["category"])
            if "brand" in product:
                brands.add(product["brand"])

        # Find similar products by category or brand, excluding the ones already in cart
        similar_query = {
            "$and": [
                {"_id": {"$nin": [ObjectId(pid) for pid in product_ids]}},
                {"$or": [
                    {"category": {"$in": list(categories)}},
                    {"brand": {"$in": list(brands)}}
                ]},
                {"status": "active"}  # Optional: only show available products
            ]
        }

        similar_products = list(products_collection.find(similar_query).limit(10))

        # Format the output
        formatted = []
        for product in similar_products:
            formatted.append({
                "product_id": str(product["_id"]),
                "name": product["name"],
                "brand": product.get("brand"),
                "price": product.get("price"),
                "images": product.get("images", []),
                "category": product.get("category"),
                "discount": product.get("discount", 0),
            })

        return jsonify({"similar_products": formatted})

    except Exception as e:
        print("🔥 Similar products route error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500




@customer_bp.route("/cart/paired-with/<customer_id>", methods=["GET"])
def get_paired_with_products(customer_id):
    try:
        cart_doc = cart_collection.find_one({"customer_id": customer_id})
        if not cart_doc or not cart_doc.get("items"):
            return jsonify({"paired_products": []})

        # Extract product_ids from cart
        cart_product_ids = [ObjectId(item["product_id"]) for item in cart_doc["items"] if "product_id" in item]

        # Get cart product documents
        cart_products = list(products_collection.find({"_id": {"$in": cart_product_ids}}))

        # Collect all paired_with product IDs
        paired_ids = set()
        for product in cart_products:
            if "paired_with" in product and isinstance(product["paired_with"], list):
                paired_ids.update(ObjectId(pid) for pid in product["paired_with"])

        # Remove items already in cart
        paired_ids -= set(cart_product_ids)

        if not paired_ids:
            return jsonify({"paired_products": []})

        # Fetch paired products from DB
        paired_products = list(products_collection.find({
            "_id": {"$in": list(paired_ids)},
            "status": "active"
        }))

        # Format response
        formatted = []
        for product in paired_products:
            formatted.append({
                "product_id": str(product["_id"]),
                "name": product.get("name"),
                "brand": product.get("brand"),
                "price": product.get("price"),
                "discount": product.get("discount", 0),
                "images": product.get("images", []),
                "category": product.get("category"),
            })

        return jsonify({"paired_products": formatted})

    except Exception as e:
        print("🔥 Paired-with route error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500




@customer_bp.route('/cart/offers/<customer_id>', methods=['GET'])
def get_cart_offers(customer_id):
    try:
        cart_items = list(cart_collection.find({'customer_id': customer_id}))
        if not cart_items:
            return jsonify({"offers": []})

        product_ids = [item['product_id'] for item in cart_items]
        products = list(products_collection.find({"_id": {"$in": [ObjectId(pid) for pid in product_ids]}}))

        categories = [p.get("category") for p in products]
        brands = [p.get("brand") for p in products]
        total = sum((p.get("price", 0) * i["quantity"]) for i in cart_items for p in products if str(p["_id"]) == i["product_id"])

        offers = []

        # 🎯 Example offer logic
        if "Electronics" in categories and total > 5000:
            offers.append({"type": "discount", "text": "📱 Buy Electronics worth ₹5000+ & get ₹500 OFF!"})

        if "Nike" in brands and "Adidas" in brands:
            offers.append({"type": "combo", "text": "👟 Nike + Adidas combo! Get 15% OFF"})

        offers.append({"type": "supercoin", "text": f"⭐ You will earn {total // 100} SuperCoins!"})

        return jsonify({"offers": offers})

    except Exception as e:
        print("🔥 Offer route error:", e)
        return jsonify({"error": "Internal server error"}), 500





@customer_bp.route('/cart/bought_together/<customer_id>', methods=['GET'])
@token_required
def bought_together(customer_id):
    try:
        cart_items = cart_collection.find({"customer_id": customer_id})
        cart_product_ids = [item["product_id"] for item in cart_items]

        suggestions = []

        for pid in cart_product_ids:
            product = products_collection.find_one({"_id": ObjectId(pid)})
            if not product:
                continue

            gender = product.get("gender", "").lower()
            category = product.get("category", "").lower()
            subcategory = product.get("subcategory", "").lower()

            # Use `pairs_with` array if present
            if "pairs_with" in product and isinstance(product["pairs_with"], list):
                logging.info(f"Found pairs_with for {product['name']}: {product['pairs_with']}")
                for pair_id in product["pairs_with"]:
                    match = products_collection.find_one({"_id": ObjectId(pair_id)})
                    if match and match.get("gender", "").lower() == gender:
                        suggestions.append({
                            "product_id": str(match["_id"]),
                            "name": match["name"],
                            "price": match["price"],
                            "brand": match.get("brand", ""),
                            "image": match.get("images", [""])[0]
                        })
            else:
                # fallback based on matching gender/category/subcategory
                match_cursor = products_collection.find({
                    "_id": {"$ne": product["_id"]},
                    "gender": gender,
                    "category": category,
                    "subcategory": {"$ne": subcategory}
                }).limit(3)

                for match in match_cursor:
                    logging.info(f"Suggested for {product['name']}: {match['name']}")
                    suggestions.append({
                        "product_id": str(match["_id"]),
                        "name": match["name"],
                        "price": match["price"],
                        "brand": match.get("brand", ""),
                        "image": match.get("images", [""])[0]
                    })

        return jsonify({"bought_together": suggestions})

    except Exception as e:
        logging.error(f"Error in bought_together: {str(e)}")
        return jsonify({"error": "Failed to get bought together items"}), 500

