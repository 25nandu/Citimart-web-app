#MONGO_URI = "mongodb://localhost:27017/"
MONGO_URI = "mongodb+srv://citimart02:Citimart1234Nandini@cluster0.ic0ghto.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET_KEY = "your_jwt_secret"

#FRONTEND_URL = "http://localhost:3000"

import os
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
