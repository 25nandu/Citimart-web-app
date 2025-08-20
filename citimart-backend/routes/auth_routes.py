from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from database import users_collection, vendors_collection
from utils.auth_utils import generate_token
from utils.email_utils import send_email
import random, string
import os
import uuid
from werkzeug.utils import secure_filename


auth_bp = Blueprint('auth', __name__)

# ------------------ REGISTER (Customer) ------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    if users_collection.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(data["password"])

    users_collection.insert_one({
        "name": data["name"],
        "email": data["email"],
        "password": hashed_password,
        "role": "customer"
    })

    return jsonify({"message": "Registration successful!"}), 201


# ------------------ LOGIN (Customer / Admin / Vendor) ------------------
'''
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    role = data.get("role")
    email = data.get("email")
    password = data.get("password")

    if not role or not email or not password:
        return jsonify({"error": "Missing role, email, or password"}), 400

    if role == "vendor":
        user = vendors_collection.find_one({"email": email, "status": "approved"})

        # ✅ Restriction check
        if user and user.get("restricted_until"):
            try:
                from datetime import datetime
                restricted_date = datetime.strptime(user["restricted_until"], "%Y-%m-%d")
                if datetime.utcnow() < restricted_date:
                    return jsonify({
                        "error": f"Your account is restricted until {user['restricted_until']}."
                    }), 403
            except:
                pass
    else:
        user = users_collection.find_one({"email": email, "role": role})

    try:
        if not user or not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception:
        return jsonify({"error": "Corrupted password. Please reset or re-register."}), 500

    token = generate_token(user["_id"], role)

    response = {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": role,
            "email": user.get("email", ""),
            "fullName": user.get("name") or user.get("fullName") or "", 
            "phone": user.get("phone", "")
        }
    }

    return jsonify(response), 200


# ------------------ FORGOT PASSWORD (Vendor / Customer) ------------------
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get("email")
    role = data.get("role")

    collection = vendors_collection if role == "vendor" else users_collection
    user = collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": reset_token}}
    )

    link = f"http://localhost:3000/reset-password/{reset_token}"
    send_email(email, "Reset Password", f"Click the link to reset your password: {link}")

    return jsonify({"message": "Password reset link sent"}), 200


# ------------------ SET PASSWORD (After Forgot Password) ------------------

import traceback

@auth_bp.route('/set-password', methods=['POST'])
def set_password():
    try:
        data = request.json
        print("Raw request data:", request.data)
        print("Parsed JSON:", data)

        reset_token = data.get("token")
        new_password = data.get("password")

        if not reset_token or not new_password:
            return jsonify({"error": "Missing token or password"}), 400

        hashed_password = generate_password_hash(new_password)

        user = vendors_collection.find_one({"reset_token": reset_token})
        collection = vendors_collection

        if not user:
            user = users_collection.find_one({"reset_token": reset_token})
            collection = users_collection

        if not user:
            return jsonify({"error": "Invalid or expired token"}), 404

        collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_password},
                "$unset": {"reset_token": ""}
            }
        )

        return jsonify({"message": "Password has been set successfully."}), 200

    except Exception as e:
        print("Error in set-password:", e)
        traceback.print_exc()  # 🟢 This shows the exact error + line number
        return jsonify({"error": "Internal server error"}), 500

'''

# ------------------ LOGIN (Customer) ------------------
@auth_bp.route('/login/customer', methods=['POST'])
def login_customer():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email, "role": "customer"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user["_id"], "customer")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "customer",
            "email": user.get("email"),
            "fullName": user.get("name", "")
        }
    }), 200


# ------------------ LOGIN (Vendor) ------------------
@auth_bp.route('/login/vendor', methods=['POST'])
def login_vendor():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = vendors_collection.find_one({"email": email, "status": "approved"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Check vendor restrictions
    if user.get("restricted_until"):
        from datetime import datetime
        restricted_date = datetime.strptime(user["restricted_until"], "%Y-%m-%d")
        if datetime.utcnow() < restricted_date:
            return jsonify({
                "error": f"Your account is restricted until {user['restricted_until']}"
            }), 403

    token = generate_token(user["_id"], "vendor")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "vendor",
            "email": user.get("email"),
            "fullName": user.get("fullName", "")
        }
    }), 200


# ------------------ LOGIN (Admin) ------------------
@auth_bp.route('/login/admin', methods=['POST'])
def login_admin():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email, "role": "admin"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user["_id"], "admin")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "admin",
            "email": user.get("email"),
            "fullName": user.get("name", "")
        }
    }), 200

# ------------------ REGISTER VENDOR ------------------

UPLOAD_FOLDER = "static/uploads/vendor_products"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@auth_bp.route("/register-vendor", methods=["POST"])
def register_vendor():
    try:
        # ✅ Get form data
        fullName = request.form.get("fullName")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")
        businessName = request.form.get("businessName")
        businessType = request.form.get("businessType")
        businessRegNo = request.form.get("businessRegNo")
        gstNo = request.form.get("gstNo")
        businessAddress = request.form.get("businessAddress")
        skuCount = request.form.get("skuCount")
        priceRange = request.form.get("priceRange")
        productType = request.form.get("productType")
        website = request.form.get("website")
        socialLinks = request.form.get("socialLinks")
        inventoryReady = request.form.get("inventoryReady")
        shipping = request.form.get("shipping")
        appeal = request.form.get("appeal")
        productDesc = request.form.get("productDesc")
        termsAgreed = request.form.get("termsAgreed") == "true"

        # ✅ Parse categories & subcategories (coming as strings from frontend)
        productCategories = eval(request.form.get("productCategories", "[]"))
        clothingSubcategories = eval(request.form.get("clothingSubcategories", "[]"))

        # ✅ Upload documents
        documents = []
        if "documents" in request.files:
            for file in request.files.getlist("documents"):
                filename = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(UPLOAD_FOLDER, unique_name))
                documents.append(unique_name)

        # ✅ Upload product images
        productImages = []
        if "productImages" in request.files:
            for file in request.files.getlist("productImages"):
                filename = secure_filename(file.filename)
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file.save(os.path.join(UPLOAD_FOLDER, unique_name))
                productImages.append(unique_name)

        # ✅ Check for duplicate email
        if vendors_collection.find_one({"email": email}):
            return jsonify({"error": "Email already exists"}), 400

        hashed_password = generate_password_hash(password)

        vendor_data = {
            "fullName": fullName,
            "email": email,
            "phone": phone,
            "password": hashed_password,
            "businessName": businessName,
            "businessType": businessType,
            "businessRegNo": businessRegNo,
            "gstNo": gstNo,
            "businessAddress": businessAddress,
            "productCategories": productCategories,
            "clothingSubcategories": clothingSubcategories,
            "skuCount": skuCount,
            "priceRange": priceRange,
            "productType": productType,
            "website": website,
            "socialLinks": socialLinks,
            "inventoryReady": inventoryReady,
            "shipping": shipping,
            "appeal": appeal,
            "productDesc": productDesc,
            "documents": documents,
            "productImages": productImages,
            "termsAgreed": termsAgreed,
            "status": "pending",
            "approvedCategories": []  # Admin will approve later
        }

        vendors_collection.insert_one(vendor_data)

        return jsonify({"message": "Vendor application submitted successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500