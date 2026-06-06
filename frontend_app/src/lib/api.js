import axios from 'axios';
import useStore from '../store/useStore';

const DEVICE_TOKEN_KEY = 'stafftrack-device-token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get/set device token from localStorage
export function getDeviceToken() {
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceToken(token) {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

export function clearDeviceToken() {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
}

// Add a request interceptor to inject the JWT token AND device token
api.interceptors.request.use(
  (config) => {
    const { token } = useStore.getState();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Always send device token if available
    const deviceToken = getDeviceToken();
    if (deviceToken) {
      config.headers['X-Device-Token'] = deviceToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized AND 403 device blocks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.deviceBlocked) {
      // Device is not authorized — trigger the device gate
      window.dispatchEvent(new CustomEvent('device-blocked'));
      return Promise.reject(error);
    }
    
    if (error.response && error.response.status === 401) {
      // Ignore 401 on login so we can show the error message without refreshing
      if (error.config && error.config.url && error.config.url.includes('/auth/login')) {
        return Promise.reject(error);
      }
      
      // Auto logout if token is expired or invalid
      const { logout } = useStore.getState();
      logout();
      window.location.href = '/admin/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
