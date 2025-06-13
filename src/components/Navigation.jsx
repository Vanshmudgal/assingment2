// src/components/Navigation.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';

const Navigation = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        {user.role === 'manager' && (
          <Link to="/reports" style={styles.link}>Reports</Link>
        )}
      </div>
      <div style={styles.right}>
        <span style={styles.user}>Logged in as: {user.name} ({user.role})</span>
        <button onClick={handleLogout} style={styles.button}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: 'white',
    alignItems: 'center'
  },
  left: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  right: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#555'
    }
  },
  button: {
    padding: '5px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    ':hover': {
      backgroundColor: '#c82333'
    }
  },
  user: {
    marginRight: '10px',
    fontWeight: 'bold'
  }
};

export default Navigation;