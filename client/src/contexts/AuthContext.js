import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get current user
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        setUser(response.data.data.user);
        setPermissions(response.data.data.user.permissions || {});
      } else {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Try to refresh token
      await refreshToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Save tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Set user state
        setUser(user);
        setPermissions(user.permissions || {});
        
        return { success: true };
      }
      
      return {
        success: false,
        error: response.data.error || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (email, password, full_name, role = 'cashier') => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
        role
      });
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Save tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Set user state
        setUser(user);
        setPermissions(user.permissions || {});
        
        return { success: true };
      }
      
      return {
        success: false,
        error: response.data.error || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setPermissions({});
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        setLoading(false);
        return false;
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Save new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Get user info
        await checkAuth();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password'
      };
    }
  };

  const hasPermission = (resource, action) => {
    if (!permissions || !user) return false;
    
    // Admin has all permissions
    if (permissions.all === true) return true;
    
    // Check specific permission
    const resourcePermissions = permissions[resource];
    
    if (!resourcePermissions) return false;
    
    // If resourcePermissions is boolean
    if (typeof resourcePermissions === 'boolean') {
      return resourcePermissions;
    }
    
    // If resourcePermissions is object with actions
    if (typeof resourcePermissions === 'object') {
      return resourcePermissions[action] === true;
    }
    
    return false;
  };

  const canAccess = (resource) => {
    if (!permissions || !user) return false;
    
    // Admin has all permissions
    if (permissions.all === true) return true;
    
    // Check if resource exists in permissions
    const resourcePermissions = permissions[resource];
    
    if (!resourcePermissions) return false;
    
    // If boolean, return it
    if (typeof resourcePermissions === 'boolean') {
      return resourcePermissions;
    }
    
    // If object, check if any action is allowed
    if (typeof resourcePermissions === 'object') {
      return Object.values(resourcePermissions).some(val => val === true);
    }
    
    return false;
  };

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const success = await refreshToken();
          
          if (success) {
            // Retry original request with new token
            const token = localStorage.getItem('accessToken');
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    permissions,
    login,
    register,
    logout,
    changePassword,
    hasPermission,
    canAccess,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
