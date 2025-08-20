from pymongo import MongoClient
from werkzeug.security import generate_password_hash

MONGO_URI = "mongodb+srv://citimart02:Citimart1234Nandini@cluster0.ic0ghto.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["citimart_db"]
users = db["users"]

admin_email = "admin@citimart.com"
admin_password = "admin123"
hashed_password = generate_password_hash(admin_password)

if users.find_one({"email": admin_email, "role": "admin"}):
    print("Admin already exists.")
else:
    users.insert_one({
        "name": "Admin",
        "email": admin_email,
        "password": hashed_password,
        "role": "admin"
    })
    print("Admin user created successfully!")


