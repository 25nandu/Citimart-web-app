import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styles from './App.module.css';
import { CartProvider } from './contexts/CartContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import VendorLayout from './layouts/VendorLayout';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword'; 
import CustomerLogin from "./pages/CustomerLogin";
import VendorLogin from "./pages/VendorLogin";
import AdminLogin from "./pages/AdminLogin";



import Offers from './pages/Offers';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import VendorSettings from './pages/VendorSettings';
import AdminSettings from './pages/AdminSettings';
import CustomerSettings from './pages/CustomerSettings';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OfferProducts from "./pages/OfferProducts";

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminVendors from './pages/admin/Vendors';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import EditProduct from './pages/admin/EditProduct';

import SetPassword from './pages/vendor/SetPassword'; // ✅ Correct path
import AdminOffers from "./pages/admin/AdminOffers";



// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';
import VendorAnalytics from './pages/vendor/Analytics';
import RegisterVendor from './pages/vendor/RegisterVendor';
import VendorForgotPassword from "./pages/VendorForgotPassword";

import VendorAddProduct from './pages/vendor/AddProduct';
import EditProducts from './pages/vendor/EditProducts';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  return (
    <CartProvider>
      <div className={styles.app}>
          <ToastContainer />
          
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            {/* <Route path="login" element={<Login />} /> */}
             <Route path="/login" element={<CustomerLogin />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="register" element={<Register />} />
            <Route path="forgotpassword" element={<ForgotPassword/>}/>
            
            <Route path="offers" element={<Offers />} />
            <Route path="/offers/:offerId" element={<OfferProducts />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="/customer-settings" element={<CustomerSettings />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
           <Route path="/reset-password/:token" element={<ResetPassword />} />
           <Route path="/set-password/:token" element={<SetPassword />} />
           
          {/* Admin Routes */}
           <Route path="/admin" element={<AdminLayout />}>
           <Route path="dashboard" element={<AdminDashboard />} />
           <Route path="products" element={<AdminProducts />} />
           <Route path="vendors" element={<AdminVendors />} />
           <Route path="users" element={<AdminUsers />} />
           <Route path="orders" element={<AdminOrders />} />
           <Route path="add-product" element={<AdminAddProduct />} />
           <Route path="edit-product/:id" element={<EditProduct />} />
           <Route path="offers" element={<AdminOffers />} />
           <Route path="settings" element={<AdminSettings />} />
           </Route>

           

        

          {/* Vendor Routes */}
          <Route path="register-vendor" element={<RegisterVendor />} />
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="add-product" element={<VendorAddProduct />} />
            <Route path="/vendor/edit-product/:productId" element={<EditProducts />} />
            <Route path="/vendor/forgotpassword" element={<VendorForgotPassword />} />

          </Route>
         
          <Route path="admin-settings" element={<AdminSettings />} />
          <Route path="vendor-settings" element={<VendorSettings />} />
        </Routes>
      </div>
    </CartProvider>
  );
}

export default App; 