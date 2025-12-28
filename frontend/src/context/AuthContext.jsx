import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedPermissions = localStorage.getItem('permissions');

      if (token && savedUser && savedPermissions) {
        try {
          setUser(JSON.parse(savedUser));
          setPermissions(JSON.parse(savedPermissions));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved auth data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save to localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('permissions', JSON.stringify(data.data.permissions));

      // Update state
      setUser(data.data.user);
      setPermissions(data.data.permissions);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      setUser(null);
      setPermissions({});
      setIsAuthenticated(false);
    }
  };

  const hasPermission = (moduleName, action = 'view') => {
    if (!permissions[moduleName]) {
      return false;
    }
    return permissions[moduleName][`can_${action}`] === true;
  };

  const getModulePermission = (moduleName) => {
    return permissions[moduleName] || {
      can_view: false,
      can_edit: false,
      can_delete: false,
      can_export: false
    };
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    getModulePermission,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
