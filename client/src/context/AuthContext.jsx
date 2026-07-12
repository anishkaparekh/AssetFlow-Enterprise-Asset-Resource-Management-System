import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create Auth Context
const AuthContext = createContext(null);

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth State on Mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        // Set authorization header globally
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
          setRole(res.data.role);
          localStorage.setItem('role', res.data.role);
        } catch (err) {
          console.error('Failed to authenticate token:', err);
          // Token is invalid/expired
          logout();
        }
      } else {
        setUser(null);
        setRole(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Login Function
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('role', userData.role);
      
      setToken(userToken);
      setUser(userData);
      setRole(userData.role);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Register Function
  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      const { token: userToken, user: userData } = res.data;
      
      // Auto-login upon successful registration
      localStorage.setItem('token', userToken);
      localStorage.setItem('role', userData.role);
      
      setToken(userToken);
      setUser(userData);
      setRole(userData.role);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, role, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
