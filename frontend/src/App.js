// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import HistoryPage from './components/HistoryPage';
import './App.css';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show a loading indicator while authentication status is being determined
  if (loading) {
    return <div className="loading-full-page">Loading authentication...</div>;
  }

  // If not authenticated, redirect to login page
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    // Wrap the entire application with AuthProvider to make auth context available
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            }
          />

          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={<AuthRedirect />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Component to handle redirection based on authentication status
function AuthRedirect() {
  const { isAuthenticated, loading } = useAuth();

  // Show a loading indicator while authentication status is being determined
  if (loading) {
    return <div className="loading-full-page">Loading...</div>;
  }

  // If authenticated, redirect to dashboard; otherwise, redirect to login
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}

export default App;
