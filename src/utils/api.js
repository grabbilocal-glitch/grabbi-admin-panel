import axios from 'axios'

// Use relative path in development to leverage Vite proxy (avoid CORS)
// Use full URL in production
const isDevelopment = import.meta.env.DEV
const baseURL = isDevelopment
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'https://grabbi-backend.onrender.com/api')

export const api = axios.create({
  baseURL,
})

// Add token to requests if available
try {
  const token = localStorage.getItem('admin_token')
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
} catch {
  // localStorage may not be available in test environments
}

// Logout handler callback — set from App.jsx so React handles the redirect
let _logoutHandler = null

export function setLogoutHandler(fn) {
  _logoutHandler = fn
}

// Flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('admin_refresh_token')

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const newToken = refreshResponse.data.token || refreshResponse.data.access_token
          const newRefreshToken = refreshResponse.data.refresh_token

          if (newToken) {
            localStorage.setItem('admin_token', newToken)
            if (newRefreshToken) {
              localStorage.setItem('admin_refresh_token', newRefreshToken)
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`

            processQueue(null, newToken)
            isRefreshing = false

            return api(originalRequest)
          }
        } catch {
          // Refresh failed — fall through to logout
          processQueue(new Error('Session expired'), null)
          isRefreshing = false
        }
      } else {
        isRefreshing = false
      }

      // No refresh token or refresh failed — logout
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refresh_token')
      delete api.defaults.headers.common['Authorization']
      if (_logoutHandler) {
        _logoutHandler()
      }
      return Promise.reject(new Error('Session expired. Please login again.'))
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'))
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Resource not found.'))
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'))
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'))
    }

    // Handle validation errors (400) - return the error message from server
    if (error.response?.data?.error) {
      return Promise.reject(new Error(error.response.data.error))
    }

    // Default error message
    return Promise.reject(new Error(error.message || 'An unexpected error occurred.'))
  }
)
