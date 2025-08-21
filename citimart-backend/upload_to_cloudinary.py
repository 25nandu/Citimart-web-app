import os
import cloudinary
import cloudinary.uploader
import cloudinary.api

#  Cloudinary Configuration (from environment variables ideally)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

UPLOAD_FOLDER = 'static/uploads'

def upload_folder_to_cloudinary(folder_path):
    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                response = cloudinary.uploader.upload(file_path, folder="uploads/")
                print(f"Uploaded {file} to {response['secure_url']}")
            except Exception as e:
                print(f"Failed to upload {file}: {e}")

#  Run it
if __name__ == "__main__":
    upload_folder_to_cloudinary(UPLOAD_FOLDER)
