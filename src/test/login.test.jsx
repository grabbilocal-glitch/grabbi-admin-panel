import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { mockAdminLoginResponse, mockNonAdminLoginResponse } from './mocks/fixtures'
import Login from '../pages/Login'

function renderLogin(props = {}) {
  const defaultProps = {
    onLogin: vi.fn(),
    ...props,
  }
  return {
    ...render(<Login {...defaultProps} />),
    onLogin: defaultProps.onLogin,
  }
}

describe('Login Page', () => {
  describe('Form rendering', () => {
    it('renders login form with email and password fields', () => {
      renderLogin()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('renders Grabbi Admin Panel heading', () => {
      renderLogin()
      expect(screen.getByText('Grabbi Admin Panel')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your admin account')).toBeInTheDocument()
    })
  })

  describe('Email validation', () => {
    it('email field has type="email" and required attribute', () => {
      renderLogin()
      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toBeRequired()
    })
  })

  describe('Password validation', () => {
    it('password field has type="password" and required attribute', () => {
      renderLogin()
      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toBeRequired()
    })
  })

  describe('Submit success', () => {
    it('calls onLogin with token when admin login succeeds', async () => {
      const user = userEvent.setup()
      const { onLogin } = renderLogin()

      await user.type(screen.getByLabelText(/email address/i), 'admin@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'validpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(onLogin).toHaveBeenCalledWith(mockAdminLoginResponse.token)
      })
    })
  })

  describe('Submit error', () => {
    it('shows error message when login fails with wrong password', async () => {
      const user = userEvent.setup()
      renderLogin()

      await user.type(screen.getByLabelText(/email address/i), 'admin@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument()
      })
    })

    it('shows access denied error when non-admin user logs in', async () => {
      server.use(
        http.post('*/api/auth/login', () => {
          return HttpResponse.json(mockNonAdminLoginResponse)
        })
      )

      const user = userEvent.setup()
      const { onLogin } = renderLogin()

      await user.type(screen.getByLabelText(/email address/i), 'customer@grabbi.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })

      expect(onLogin).not.toHaveBeenCalled()
    })
  })
})
