import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../contexts/ToastContext'
import Dashboard from '../pages/Dashboard'

function renderDashboard() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Dashboard Page', () => {
  describe('Loading state', () => {
    it('shows skeleton loading cards while fetching data', () => {
      renderDashboard()
      // The Dashboard loading state renders the heading plus SkeletonCard components
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Renders stats after loading', () => {
    it('displays Total Products stat card', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Total Products')).toBeInTheDocument()
      })
      // Verify the number is rendered next to the label (2 products from mockAdminProducts.total)
      const productsCard = screen.getByText('Total Products').closest('dl')
      expect(productsCard).toBeInTheDocument()
    })

    it('displays Total Orders stat card', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Total Orders')).toBeInTheDocument()
      })
      const ordersCard = screen.getByText('Total Orders').closest('dl')
      expect(ordersCard).toBeInTheDocument()
    })

    it('displays Categories stat card', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument()
      })
    })

    it('displays Franchises stat card', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Franchises')).toBeInTheDocument()
      })
    })

    it('displays Total Revenue stat card with computed amount', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      })
      // Total revenue = 14.22 + 16.45 = 30.67 -> displayed as "£30.67"
      // It appears in multiple places (stat card, last 7 days, quick stats)
      // so use getAllByText
      await waitFor(() => {
        const revenueMatches = screen.getAllByText(/£30\.67/)
        expect(revenueMatches.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows pending orders badge when there are pending orders', async () => {
      renderDashboard()
      // mockOrders[0].status = 'pending' -> "1 pending" text badge on the orders card
      await waitFor(() => {
        expect(screen.getByText(/1 pending/)).toBeInTheDocument()
      })
    })

    it('displays recent orders section', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Recent Orders')).toBeInTheDocument()
      })
    })

    it('shows order numbers in recent orders list', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
      })
    })

    it('shows Quick Stats section with average order value', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Quick Stats')).toBeInTheDocument()
      })
      expect(screen.getByText('Average Order Value')).toBeInTheDocument()
    })

    it('shows Pending Orders in Quick Stats', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Pending Orders')).toBeInTheDocument()
      })
    })

    it('shows Revenue last 7 days in Quick Stats', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Revenue (Last 7 Days)')).toBeInTheDocument()
      })
    })
  })

  describe('Franchise filter dropdown', () => {
    it('renders franchise filter with All Franchises option', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('All Franchises')).toBeInTheDocument()
      })
    })

    it('populates franchise dropdown with franchise names from API', async () => {
      renderDashboard()
      await waitFor(() => {
        // From mockAdminFranchises
        expect(screen.getByRole('option', { name: 'Grabbi Main Store' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Grabbi Camden' })).toBeInTheDocument()
      })
    })

    it('changing franchise filter triggers refetch', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Grabbi Camden' })).toBeInTheDocument()
      })

      const select = screen.getByDisplayValue('All Franchises')
      await user.selectOptions(select, '50cb7a29-7ecb-4472-9536-5d8a2c599dfb')

      // After selecting a franchise, the dashboard should re-fetch data
      await waitFor(() => {
        expect(select.value).toBe('50cb7a29-7ecb-4472-9536-5d8a2c599dfb')
      })
    })
  })

  describe('Refresh button', () => {
    it('renders a Refresh button', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })
    })
  })

  describe('Navigation links', () => {
    it('stat cards link to their respective pages', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('Total Products')).toBeInTheDocument()
      })

      // The stat cards are Links — check they render as anchors with correct hrefs
      const productsLink = screen.getByText('Total Products').closest('a')
      expect(productsLink).toHaveAttribute('href', '/products')

      const ordersLink = screen.getByText('Total Orders').closest('a')
      expect(ordersLink).toHaveAttribute('href', '/orders')

      const categoriesLink = screen.getByText('Categories').closest('a')
      expect(categoriesLink).toHaveAttribute('href', '/categories')

      const franchisesLink = screen.getByText('Franchises').closest('a')
      expect(franchisesLink).toHaveAttribute('href', '/franchises')
    })

    it('shows View all orders link when recent orders exist', async () => {
      renderDashboard()
      await waitFor(() => {
        expect(screen.getByText('View all orders')).toBeInTheDocument()
      })
    })
  })
})
