import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import styles from './VendorLayout.module.css';
import {
  FaHome,
  FaBox,
  FaShoppingBag,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
} from 'react-icons/fa';

const VendorLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    // Load vendor name from localStorage on component mount
    const storedName = localStorage.getItem('name');
    if (storedName) {
      setVendorName(storedName);
    }
  }, []);

  const navItems = [
    { path: '/vendor', icon: <FaHome />, label: 'Dashboard' },
    { path: '/vendor/products', icon: <FaBox />, label: 'My Products' },
    { path: '/vendor/orders', icon: <FaShoppingBag />, label: 'Orders' },
    { path: '/vendor/analytics', icon: <FaChartLine />, label: 'Analytics' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>VENDOR</h1>
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
            <h2>Vendor Dashboard</h2>
            <div className={styles.userInfo}>
              <span>{vendorName || 'Vendor'}</span>
              <Link to="/vendor-settings" className={styles.settingsIcon}>
                <FaCog />
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

export default VendorLayout;
