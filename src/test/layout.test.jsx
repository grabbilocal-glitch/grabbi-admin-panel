import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../components/Layout'

function renderLayout(props = {}, initialEntry = '/dashboard') {
  const defaultProps = {
    onLogout: vi.fn(),
    ...props,
  }
  return {
    ...render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Layout {...defaultProps} />
      </MemoryRouter>
    ),
    onLogout: defaultProps.onLogout,
  }
}

describe('Layout Component', () => {
  describe('Sidebar renders', () => {
    it('renders Grabbi Admin branding', () => {
      renderLayout()
      const brandTexts = screen.getAllByText('Grabbi Admin')
      expect(brandTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Navigation items', () => {
    it('renders all navigation links', () => {
      renderLayout()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.getByText('Franchises')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Promotions')).toBeInTheDocument()
    })

    it('renders Logout button', () => {
      renderLayout()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })

  describe('Active route highlight', () => {
    it('marks Dashboard link as current page when on /dashboard', () => {
      renderLayout({}, '/dashboard')
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('aria-current', 'page')
    })

    it('marks Products link as current page when on /products', () => {
      renderLayout({}, '/products')
      const productsLink = screen.getByText('Products').closest('a')
      expect(productsLink).toHaveAttribute('aria-current', 'page')
    })

    it('does not mark non-active routes', () => {
      renderLayout({}, '/dashboard')
      const productsLink = screen.getByText('Products').closest('a')
      expect(productsLink).not.toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Mobile toggle', () => {
    it('renders mobile menu toggle button', () => {
      renderLayout()
      const toggleBtn = screen.getByLabelText('Toggle menu')
      expect(toggleBtn).toBeInTheDocument()
    })
  })

  describe('Logout', () => {
    it('calls onLogout when Logout button is clicked', async () => {
      const user = userEvent.setup()
      const { onLogout } = renderLayout()

      await user.click(screen.getByText('Logout'))

      expect(onLogout).toHaveBeenCalledTimes(1)
    })
  })
})
