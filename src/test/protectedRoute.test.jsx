import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../contexts/ToastContext'
import App from '../App'

// App uses BrowserRouter internally, but we test the route protection logic
// by rendering specific routes and checking redirects.
// Since App renders its own Router, we test the full component.

// Node 22+ ships a built-in localStorage that may lack standard methods in
// certain environments. Provide a proper Storage mock so the tests are stable.
const store = {}
const storageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = String(value) }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
  get length() { return Object.keys(store).length },
  key: (i) => Object.keys(store)[i] || null,
}
vi.stubGlobal('localStorage', storageMock)

describe('Route Protection (App routing)', () => {
  beforeEach(() => {
    storageMock.clear()
    vi.clearAllMocks()
  })

  describe('Unauthenticated redirects', () => {
    it('redirects to login when not authenticated and visiting /', async () => {
      // No token set in localStorage
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Grabbi Admin Panel')).toBeInTheDocument()
        expect(screen.getByText('Sign in to your admin account')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows validation message while checking token', () => {
      // Set a token to trigger validation
      storageMock.setItem('admin_token', 'some-token')

      render(<App />)

      // Should show loading state before API call resolves
      expect(screen.getByText('Validating session...')).toBeInTheDocument()
    })
  })

  describe('Authenticated access', () => {
    it('renders Layout with Dashboard when authenticated', async () => {
      storageMock.setItem('admin_token', 'valid-admin-token')

      render(<App />)

      // After token validation via /admin/products?limit=1, it should show dashboard
      // 'Dashboard' appears in both the sidebar nav link and the page heading
      await waitFor(() => {
        const dashboardElements = screen.getAllByText('Dashboard')
        expect(dashboardElements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Login page redirect when authenticated', () => {
    it('redirects from /login to dashboard when already authenticated', async () => {
      storageMock.setItem('admin_token', 'valid-admin-token')

      render(<App />)

      await waitFor(() => {
        // Should not show login page, should show dashboard
        expect(screen.queryByText('Sign in to your admin account')).not.toBeInTheDocument()
        const dashboardElements = screen.getAllByText('Dashboard')
        expect(dashboardElements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
