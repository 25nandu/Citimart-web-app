import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import {
  FaHome,
  FaBox,
  FaUsers,
  FaStore,
  FaSignOutAlt,
  FaShoppingBag,
  FaBars,
  FaCog,
} from 'react-icons/fa';

import logo from '../assets/logo.jpeg'; 

const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { path: '/admin/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FaBox />, label: 'Products' },
    { path: '/admin/orders', icon: <FaShoppingBag />, label: 'Orders' },
    { path: '/admin/vendors', icon: <FaStore />, label: 'Vendors' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Users' },
  ];

  return (
    <div className={styles.layout}>
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.collapsed}`}
      >
        <div className={styles.sidebarHeader}>
          <h1 >
        <Link to="/" className={styles.logo}>
  <img src={logo} alt="CitiMart Logo" className={styles.logoImage} />
</Link>
</h1>

          <button
            className={styles.toggleBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <FaBars />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <Link to="/Login" className={styles.logoutBtn}>
            <FaSignOutAlt />
            <span>Logout</span>
          </Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2>Admin Panel</h2>
            <div className={styles.userInfo}>
              <span>Hey Admin </span>
              <Link to="/admin-settings">
                <FaCog className={styles.settingsIcon} />
              </Link>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
