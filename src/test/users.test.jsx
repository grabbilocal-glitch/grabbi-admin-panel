import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockOrders, mockAdminFranchises, mockAdminLoginResponse } from './mocks/fixtures'
import Orders from '../pages/Orders'
import Login from '../pages/Login'

// NOTE: The app does not have a standalone Users page. These tests cover
// user-related functionality across the application: user info in orders,
// franchise owner info, and authentication-based user role handling.

function renderOrders() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('User-related Functionality', () => {
  describe('User info in orders', () => {
    it('displays customer names in order list', async () => {
      renderOrders()
      await waitFor(() => {
        // mockOrders[1].user.name = 'Test Customer'
        expect(screen.getByText(/Test Customer/)).toBeInTheDocument()
      })
    })

    it('displays customer emails in order list', async () => {
      const user = userEvent.setup()
      renderOrders()

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText(/Test Customer/)).toBeInTheDocument()
      })

      // Expand order details to reveal customer email
      const detailButtons = screen.getAllByText('Order Details')
      await user.click(detailButtons[detailButtons.length - 1])

      await waitFor(() => {
        expect(screen.getByText(/testcustomer@grabbi\.com/)).toBeInTheDocument()
      })
    })
  })

  describe('Role-based authentication', () => {
    it('allows admin role to log in successfully', async () => {
      const user = userEvent.setup()
      const onLogin = vi.fn()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByLabelText(/email address/i), 'admin@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'validpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledWith(mockAdminLoginResponse.token)
      })
    })

    it('rejects non-admin role login', async () => {
      server.use(
        http.post('*/api/auth/login', () => {
          return HttpResponse.json({
            token: 'customer-token',
            user: {
              id: 'cust-1',
              email: 'customer@grabbi.com',
              name: 'Customer User',
              role: 'customer',
              loyalty_points: 0,
              franchise_id: null,
            },
          })
        })
      )

      const user = userEvent.setup()
      const onLogin = vi.fn()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByLabelText(/email address/i), 'customer@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })

      expect(onLogin).not.toHaveBeenCalled()
    })

    it('rejects franchise_owner role login', async () => {
      server.use(
        http.post('*/api/auth/login', () => {
          return HttpResponse.json({
            token: 'owner-token',
            user: {
              id: 'owner-1',
              email: 'owner@grabbi.com',
              name: 'Franchise Owner',
              role: 'franchise_owner',
              loyalty_points: 0,
              franchise_id: 'some-franchise-id',
            },
          })
        })
      )

      const user = userEvent.setup()
      const onLogin = vi.fn()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByLabelText(/email address/i), 'owner@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })

      expect(onLogin).not.toHaveBeenCalled()
    })
  })

  describe('Login loading state', () => {
    it('shows Signing in... text while submitting', async () => {
      // Use a delayed handler to keep the loading state visible
      server.use(
        http.post('*/api/auth/login', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(mockAdminLoginResponse)
        })
      )

      const user = userEvent.setup()
      const onLogin = vi.fn()

      render(<Login onLogin={onLogin} />)

      await user.type(screen.getByLabelText(/email address/i), 'admin@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'validpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // The button should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument()

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalled()
      })
    })
  })
})
