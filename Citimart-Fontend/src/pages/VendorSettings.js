import React, { useState } from 'react';
import styles from './VendorSettings.module.css';

const tabs = [
  'Profile',
  'Account',
  'Payments',
  'Shipping',
  'Catalog',
  'Notifications',
  'Compliance',
  'Reports',
  'Support'
];

const VendorSettings = () => {
  const [activeTab, setActiveTab] = useState('Profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'Profile':
        return (
          <div className={styles.tabContent}>
            <h2>Business Profile</h2>
            <form className={styles.form}>
              <label>Business Name</label>
              <input type="text" placeholder="Enter business name" />

              <label>Contact Person</label>
              <input type="text" placeholder="Enter contact person name" />

              <label>Email</label>
              <input type="email" placeholder="Enter email" />

              <label>Phone Number</label>
              <input type="tel" placeholder="Enter phone number" />

              <label>Business Type</label>
              <select>
                <option>Individual</option>
                <option>Company</option>
              </select>

              <label>GST/VAT Number</label>
              <input type="text" placeholder="Enter GST or VAT number" />

              <label>Business Address</label>
              <textarea placeholder="Enter full business address"></textarea>

              <button type="submit">Save Profile</button>
            </form>
          </div>
        );
      case 'Account':
        return (
          <div className={styles.tabContent}>
            <h2>Account & Security</h2>
            <form className={styles.form}>
              <label>Username</label>
              <input type="text" value="vendor123" readOnly />

              <label>Change Password</label>
              <input type="password" placeholder="New Password" />

              <label>Enable Two-Factor Authentication</label>
              <select>
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <button type="submit">Update Account</button>
            </form>
          </div>
        );
      case 'Payments':
        return (
          <div className={styles.tabContent}>
            <h2>Bank & Payment Info</h2>
            <form className={styles.form}>
              <label>Bank Account Number</label>
              <input type="text" placeholder="Enter account number" />

              <label>IFSC/SWIFT Code</label>
              <input type="text" placeholder="Enter IFSC or SWIFT code" />

              <label>UPI ID</label>
              <input type="text" placeholder="Enter UPI ID" />

              <label>Settlement Cycle</label>
              <select>
                <option>Weekly</option>
                <option>Bi-weekly</option>
              </select>

              <button type="submit">Save Payment Info</button>
            </form>
          </div>
        );
      case 'Shipping':
        return (
          <div className={styles.tabContent}>
            <h2>Shipping & Logistics</h2>
            <form className={styles.form}>
              <label>Default Warehouse Address</label>
              <textarea placeholder="Enter warehouse address"></textarea>

              <label>Preferred Courier</label>
              <input type="text" placeholder="e.g., Delhivery, Shiprocket" />

              <label>Pickup Time Slot</label>
              <input type="text" placeholder="e.g., 10am - 1pm" />

              <label>Return Pickup Address</label>
              <textarea placeholder="Enter return address"></textarea>

              <button type="submit">Update Shipping Info</button>
            </form>
          </div>
        );
      case 'Catalog':
        return (
          <div className={styles.tabContent}>
            <h2>Catalog Settings</h2>
            <form className={styles.form}>
              <label>Brand Name</label>
              <input type="text" placeholder="Enter your brand name" />

              <label>Default Category</label>
              <input type="text" placeholder="e.g., Apparel, Electronics" />

              <label>Allow Auto Listing Approval</label>
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>

              <label>Enable Inventory Integration</label>
              <select>
                <option>Manual</option>
                <option>API</option>
              </select>

              <button type="submit">Save Catalog Settings</button>
            </form>
          </div>
        );
      case 'Notifications':
        return (
          <div className={styles.tabContent}>
            <h2>Notifications & Alerts</h2>
            <form className={styles.form}>
              <label>Order Alerts</label>
              <select>
                <option>Email</option>
                <option>SMS</option>
                <option>In-App</option>
              </select>

              <label>Low Stock Alert</label>
              <select>
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <label>Payment Notifications</label>
              <select>
                <option>Email</option>
                <option>In-App</option>
              </select>

              <button type="submit">Update Notifications</button>
            </form>
          </div>
        );
      case 'Compliance':
        return (
          <div className={styles.tabContent}>
            <h2>Compliance Documents</h2>
            <form className={styles.form}>
              <label>Upload GST Certificate</label>
              <input type="file" />

              <label>Upload Trade License</label>
              <input type="file" />

              <label>Accept Terms</label>
              <select>
                <option>Accepted</option>
                <option>Not Accepted</option>
              </select>

              <button type="submit">Save Compliance Info</button>
            </form>
          </div>
        );
      case 'Reports':
        return (
          <div className={styles.tabContent}>
            <h2>Reports & Analytics</h2>
            <form className={styles.form}>
              <label>Report Frequency</label>
              <select>
                <option>Daily</option>
                <option>Weekly</option>
              </select>

              <label>Report Format</label>
              <select>
                <option>PDF</option>
                <option>XLS</option>
                <option>CSV</option>
              </select>

              <label>Email for Report Delivery</label>
              <input type="email" placeholder="example@domain.com" />

              <button type="submit">Save Report Settings</button>
            </form>
          </div>
        );
      case 'Support':
        return (
          <div className={styles.tabContent}>
            <h2>Support Preferences</h2>
            <form className={styles.form}>
              <label>Support Email</label>
              <input type="email" placeholder="Enter support email" />

              <label>Escalation Contact</label>
              <input type="text" placeholder="Name or number for escalation" />

              <label>Preferred Support Language</label>
              <select>
                <option>English</option>
                <option>Hindi</option>
              </select>

              <button type="submit">Update Support Info</button>
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

export default VendorSettings;