import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? (
        <p>Welcome, {user}!</p>
      ) : (
        <p>You are not logged in.</p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
