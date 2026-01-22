import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

// Add token to requests if available
const token = localStorage.getItem('admin_token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
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
