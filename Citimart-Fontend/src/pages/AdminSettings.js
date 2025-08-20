import React, { useState } from 'react';
import styles from './AdminSettings.module.css';

const tabs = [
  'Platform',
  'Users',
  'Vendors',
  'Products',
  'Payments',
  'Shipping',
  'Notifications',
  'Orders',
  'Security',
  'Integrations'
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('Platform');

  const renderContent = () => {
    switch (activeTab) {
      case 'Platform':
        return (
          <div className={styles.tabContent}>
            <h2>Platform Information</h2>
            <form className={styles.form}>
              <label>Platform Name</label>
              <input type="text" placeholder="e.g., Citimart" />

              <label>Support Email</label>
              <input type="email" placeholder="support@citimart.com" />

              <label>Contact Number</label>
              <input type="tel" placeholder="+91 98765 43210" />

              <label>Currency</label>
              <select>
                <option>INR</option>
                <option>USD</option>
              </select>

              <label>Time Zone</label>
              <input type="text" placeholder="Asia/Kolkata" />

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Users':
        return (
          <div className={styles.tabContent}>
            <h2>Admin Users</h2>
            <form className={styles.form}>
              <label>Add Admin Email</label>
              <input type="email" placeholder="admin@citimart.com" />

              <label>Assign Role</label>
              <select>
                <option>Super Admin</option>
                <option>Support</option>
                <option>Moderator</option>
              </select>

              <button type="submit">Add Admin</button>
            </form>
          </div>
        );

      case 'Vendors':
        return (
          <div className={styles.tabContent}>
            <h2>Vendor Settings</h2>
            <form className={styles.form}>
              <label>Vendor Approval Mode</label>
              <select>
                <option>Manual</option>
                <option>Auto</option>
              </select>

              <label>Default Commission (%)</label>
              <input type="number" placeholder="e.g., 10" />

              <label>Enable Vendor Tiers</label>
              <select>
                <option>No</option>
                <option>Yes</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Products':
        return (
          <div className={styles.tabContent}>
            <h2>Product Settings</h2>
            <form className={styles.form}>
              <label>Listing Approval</label>
              <select>
                <option>Manual</option>
                <option>Auto</option>
              </select>

              <label>Moderation Required</label>
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>

              <label>Banned Keywords</label>
              <textarea placeholder="e.g., fake, replica"></textarea>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Payments':
        return (
          <div className={styles.tabContent}>
            <h2>Payment Settings</h2>
            <form className={styles.form}>
              <label>Commission Rate (%)</label>
              <input type="number" placeholder="e.g., 5" />

              <label>Payment Gateway</label>
              <select>
                <option>Razorpay</option>
                <option>Cashfree</option>
                <option>PayPal</option>
              </select>

              <label>Payout Cycle</label>
              <select>
                <option>Weekly</option>
                <option>Bi-weekly</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Shipping':
        return (
          <div className={styles.tabContent}>
            <h2>Shipping Info</h2>
            <form className={styles.form}>
              <label>Default Courier</label>
              <input type="text" placeholder="e.g., Delhivery, Bluedart" />

              <label>Return Address</label>
              <textarea placeholder="Return center full address"></textarea>

              <label>Shipping Zones</label>
              <textarea placeholder="e.g., North, South, East, West"></textarea>

              <button type="submit">Update Shipping</button>
            </form>
          </div>
        );

      case 'Notifications':
        return (
          <div className={styles.tabContent}>
            <h2>Notification Preferences</h2>
            <form className={styles.form}>
              <label>Email Provider</label>
              <select>
                <option>SMTP</option>
                <option>Mailgun</option>
                <option>Amazon SES</option>
              </select>

              <label>Enable SMS Alerts</label>
              <select>
                <option>No</option>
                <option>Yes</option>
              </select>

              <label>Order Email Template</label>
              <textarea placeholder="HTML content or message"></textarea>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Orders':
        return (
          <div className={styles.tabContent}>
            <h2>Order Management</h2>
            <form className={styles.form}>
              <label>Auto-Cancel (days)</label>
              <input type="number" placeholder="e.g., 7" />

              <label>Return Window (days)</label>
              <input type="number" placeholder="e.g., 15" />

              <label>Allow Exchange</label>
              <select>
                <option>Allowed</option>
                <option>Not Allowed</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Security':
        return (
          <div className={styles.tabContent}>
            <h2>Security Settings</h2>
            <form className={styles.form}>
              <label>Enable 2FA</label>
              <select>
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <label>Password Expiry (days)</label>
              <input type="number" placeholder="e.g., 90" />

              <label>Login Attempt Limit</label>
              <input type="number" placeholder="e.g., 5" />

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Integrations':
        return (
          <div className={styles.tabContent}>
            <h2>API & Integrations</h2>
            <form className={styles.form}>
              <label>Google Analytics ID</label>
              <input type="text" placeholder="e.g., UA-12345678" />

              <label>Cashfree API Key</label>
              <input type="text" placeholder="Cashfree key" />

              <label>Razorpay Key</label>
              <input type="text" placeholder="Razorpay key" />

              <button type="submit">Save</button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>SETTINGS</h1>
        </div>
        <div className={styles.nav}>
          <ul>
            {tabs.map(tab => (
              <li
                key={tab}
                className={activeTab === tab ? styles.active : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className={styles.mainContent}>{renderContent()}</main>
    </div>
  );
};

export default AdminSettings;
