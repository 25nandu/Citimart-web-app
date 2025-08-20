import React, { useState, useEffect } from 'react';
import styles from './Users.module.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    fetch('http://localhost:5000/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data.users))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  const handleDelete = async (userId) => {
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        alert('User deleted successfully.');
      } else {
        alert('Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  };

  const openEditForm = (user) => {
    setEditUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
  };

  const handleEditSubmit = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedUser = { ...editUser, ...formData };
        setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
        alert('User updated!');
        setEditUser(null);
      } else {
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  };

  return (
    <div className={styles.users}>
      <div className={styles.header}>
        <h1>Users</h1>
    
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Join Date</th>
              <th>Orders</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.joinDate}</td>
                <td>{user.orders ?? 0}</td>

                <td>
                  <span className={`${styles.status} ${user.status === 'Active' ? styles.active : styles.inactive}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editButton} onClick={() => openEditForm(user)}>Edit</button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(user.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className={styles.editModal}>
          <h3>Edit User</h3>
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          
          <div className={styles.modalButtons}>
            <button onClick={() => handleEditSubmit(editUser.id)}>Save</button>
            <button onClick={() => setEditUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
