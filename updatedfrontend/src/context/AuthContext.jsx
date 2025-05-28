import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create AuthContext
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Axios instance with baseURL including /api/auth/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/auth/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance for token-related endpoints
const tokenApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/token/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);

  // Function to get the current access token
  const getAccessToken = () => localStorage.getItem('access_token');

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh/`, {
        refresh: refreshToken,
      });
      const { access, refresh: newRefreshToken } = response.data;
      setAccessToken(access);
      setRefreshToken(newRefreshToken);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', newRefreshToken);
      setIsAuthenticated(true);
      return access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.info('Session expired. Please log in again.');
      logout();
      throw error;
    }
  };

  // Function to fetch user details with retry on 401
  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await api.get('user-info/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      toast.error('Failed to fetch user info.');
    }
  }, [accessToken]);

  // Function to log in
  const login = ({ access, refresh }) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setIsAuthenticated(true);
    fetchUserDetails();
  };

  // Function to log out
  const logout = async () => {
    try {
      // Only attempt to blacklist the token if both refreshToken and accessToken exist
      if (refreshToken && accessToken) {
        await tokenApi.post('blacklist/', {
          refresh: refreshToken,
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } else {
        console.log('No valid tokens to blacklist. Skipping server-side logout.');
      }
    } catch (error) {
      console.error('Failed to blacklist token on logout:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      toast.info('Logout successful, but failed to notify server.');
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            toast.info('Session expired. Please log in again.');
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken]);

  // Fetch user details when access token changes
  useEffect(() => {
    if (accessToken && isAuthenticated) {
      fetchUserDetails();
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [accessToken, isAuthenticated, fetchUserDetails]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};