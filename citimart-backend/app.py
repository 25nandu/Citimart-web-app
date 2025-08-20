from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"], methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"])
    
@app.route("/")
    def home():
    return {"message": "Citimart Backend Running 🚀"}

   
    from routes.auth_routes import auth_bp
    from routes.customer_routes import customer_bp
    from routes.vendor_routes import vendor_bp
    from routes.admin_routes import admin_bp
    from routes.product_routes import product_bp
    from routes.vendor_dashboard_routes import vendor_dashboard_bp
    from routes.admin_dashboard_routes import admin_dashboard_bp
    from routes.offers_routes import offers_bp
    from routes.cart_routes import cart_bp
    


    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(customer_bp, url_prefix='/customer')
    app.register_blueprint(vendor_bp, url_prefix='/vendor')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(product_bp)
    app.register_blueprint(vendor_dashboard_bp)
    app.register_blueprint(admin_dashboard_bp, url_prefix='/api')
    app.register_blueprint(offers_bp, url_prefix="/api")
    app.register_blueprint(cart_bp)


    # ✅ MOVE THIS INSIDE
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory('static/uploads', filename)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
