// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the AuthContext
const AuthContext = createContext();

// Define the base URL for the backend API from environment variables.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// AuthProvider component to wrap your application and provide authentication state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // To indicate if auth state is being loaded

  // Effect to load user from token on initial app load or token change
  useEffect(() => {
    const loadUser = async () => {
      console.log("[AuthContext] Initializing AuthProvider...");
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        console.log("[AuthContext] Found token in localStorage. Attempting to set Axios default header.");
        // Set Axios default header immediately if token exists
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken); // Ensure token state is in sync

        // In a real app, you might want to call a backend /api/auth/me endpoint here
        // to validate the token and fetch user details.
        // For this project, we'll assume a valid token means authenticated.
        try {
          // Optional: Verify token validity with a lightweight backend call
          // const res = await axios.get(`${BACKEND_URL}/auth/me`); // Example endpoint
          // setUser(res.data);
          setUser({ isAuthenticated: true, username: 'Authenticated User' }); // Placeholder user info
          console.log("[AuthContext] User set from stored token.");
        } catch (err) {
          console.error("[AuthContext] Stored token invalid or backend /me endpoint failed:", err);
          logout(); // Invalidate token if it's no longer valid
        } finally {
          setLoading(false);
        }
      } else {
        console.log("[AuthContext] No token found in localStorage.");
        setLoading(false); // No token, so not authenticated
        setUser(null); // Ensure user is null
        delete axios.defaults.headers.common['Authorization']; // Ensure no old header
      }
    };
    loadUser();
  }, []); // Run only once on component mount

  // Login function
  const login = async (email, password) => {
    console.log("[AuthContext] Attempting login for:", email);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
      console.log("[AuthContext] Login successful. Response data:", res.data);

      setToken(res.data.token);
      setUser(res.data); // Store user data (e.g., _id, username, email)
      localStorage.setItem('token', res.data.token); // Store token in local storage
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`; // Set default auth header for subsequent requests
      return res.data; // Return user data
    } catch (err) {
      console.error("[AuthContext] Login failed:", err.response?.data?.message || err.message);
      // Ensure token and user are cleared on failed login attempt
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      throw err; // Re-throw error for component to handle
    }
  };

  // Register function
  const register = async (username, email, password) => {
    console.log("[AuthContext] Attempting registration for:", username, email);
    try {
      const res = await axios.post(`${BACKEND_URL}/auth/register`, { username, email, password });
      console.log("[AuthContext] Registration successful. Response data:", res.data);

      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      return res.data;
    } catch (err) {
      console.error("[AuthContext] Registration failed:", err.response?.data?.message || err.message);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    console.log("[AuthContext] Logging out user.");
    setToken(null);
    setUser(null);
    localStorage.removeItem('token'); // Remove token from local storage
    delete axios.defaults.headers.common['Authorization']; // Remove default auth header
  };

  // Value provided by the context to its consumers
  const authContextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token // Convenience boolean for checking authentication status
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
