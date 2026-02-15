import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Categories from './pages/Categories'
import Promotions from './pages/Promotions'
import Users from './pages/Users'
import Franchises from './pages/Franchises'
import FranchiseDetail from './pages/FranchiseDetail'
import Layout from './components/Layout'
import { api, setLogoutHandler } from './utils/api'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl font-medium text-gray-700 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    delete api.defaults.headers.common['Authorization']
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    // Register the logout handler so the API interceptor can trigger React state changes
    setLogoutHandler(() => setIsAuthenticated(false))
  }, [])

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('admin_token')
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          // Validate token by calling a lightweight admin endpoint
          await api.get('/admin/products?limit=1')
          setIsAuthenticated(true)
        } catch {
          // Token is invalid or expired — clear it
          localStorage.removeItem('admin_token')
          delete api.defaults.headers.common['Authorization']
          setIsAuthenticated(false)
        }
      }
      setLoading(false)
    }
    validateToken()
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('admin_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setIsAuthenticated(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Validating session...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
        <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
          <Route path="orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
          <Route path="categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
          <Route path="franchises" element={<ErrorBoundary><Franchises /></ErrorBoundary>} />
          <Route path="franchises/:id" element={<ErrorBoundary><FranchiseDetail /></ErrorBoundary>} />
          <Route path="promotions" element={<ErrorBoundary><Promotions /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
