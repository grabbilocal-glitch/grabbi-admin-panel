import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockOrders, mockOrderStatusUpdateResponse } from './mocks/fixtures'
import Orders from '../pages/Orders'

function renderOrders() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Orders Page', () => {
  describe('Loading state', () => {
    it('shows loading skeleton while fetching orders', () => {
      renderOrders()
      // While loading, heading "Orders" is shown with SkeletonList
      expect(screen.getByText('Orders')).toBeInTheDocument()
    })
  })

  describe('Order list rendering', () => {
    it('renders order numbers after loading', async () => {
      renderOrders()
      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
        expect(screen.getByText(/ORD202602130138527c5ba7d4/)).toBeInTheDocument()
      })
    })

    it('displays order totals formatted with pound sign', async () => {
      renderOrders()
      await waitFor(() => {
        // mockOrders[0].total = 14.22, mockOrders[1].total = 16.45
        expect(screen.getByText(/14\.22/)).toBeInTheDocument()
        expect(screen.getByText(/16\.45/)).toBeInTheDocument()
      })
    })

    it('shows status badges for each order', async () => {
      renderOrders()
      await waitFor(() => {
        // Status badges use the label from statusOptions array
        // "Pending" and "Preparing" appear as badge text AND as select option text
        // Use getAllByText and check at least the badge instances exist
        const pendingElements = screen.getAllByText('Pending')
        expect(pendingElements.length).toBeGreaterThanOrEqual(1)

        const preparingElements = screen.getAllByText('Preparing')
        expect(preparingElements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays customer names where available', async () => {
      renderOrders()
      await waitFor(() => {
        // mockOrders[1].user.name = 'Test Customer'
        expect(screen.getByText(/Test Customer/)).toBeInTheDocument()
      })
    })

    it('displays delivery addresses', async () => {
      renderOrders()
      await waitFor(() => {
        expect(screen.getByText(/123 Test St, London SW1A 1AA/)).toBeInTheDocument()
        expect(screen.getByText(/123 Camden Rd, London NW1/)).toBeInTheDocument()
      })
    })

    it('shows item count per order', async () => {
      renderOrders()
      await waitFor(() => {
        // mockOrders[0] has 1 item, mockOrders[1] has 2 items
        expect(screen.getByText(/1 items/)).toBeInTheDocument()
        expect(screen.getByText(/2 items/)).toBeInTheDocument()
      })
    })
  })

  describe('Status update', () => {
    it('renders status dropdown for each order', async () => {
      renderOrders()
      await waitFor(() => {
        // Each order has a select dropdown with status options
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('status dropdown has all status options', async () => {
      renderOrders()
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const firstSelect = selects[0]
        const options = within(firstSelect).getAllByRole('option')
        const optionValues = options.map(opt => opt.value)
        expect(optionValues).toContain('pending')
        expect(optionValues).toContain('confirmed')
        expect(optionValues).toContain('preparing')
        expect(optionValues).toContain('ready')
        expect(optionValues).toContain('out_for_delivery')
        expect(optionValues).toContain('delivered')
        expect(optionValues).toContain('cancelled')
      })
    })

    it('triggers API call when status is changed', async () => {
      let statusUpdateCalled = false
      let capturedStatus = null

      server.use(
        http.put('*/api/admin/orders/:id/status', async ({ request }) => {
          const body = await request.json()
          statusUpdateCalled = true
          capturedStatus = body.status
          return HttpResponse.json({
            ...mockOrderStatusUpdateResponse,
            status: body.status,
          })
        })
      )

      const user = userEvent.setup()
      renderOrders()

      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
      })

      // Find the first order's status dropdown (the one with value 'pending')
      const selects = screen.getAllByRole('combobox')
      // First select should be for the first order (status: pending)
      const pendingSelect = selects.find(s => s.value === 'pending')
      expect(pendingSelect).toBeTruthy()

      await user.selectOptions(pendingSelect, 'confirmed')

      await waitFor(() => {
        expect(statusUpdateCalled).toBe(true)
        expect(capturedStatus).toBe('confirmed')
      })
    })

    it('shows success toast after status update', async () => {
      const user = userEvent.setup()
      renderOrders()

      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
      })

      const selects = screen.getAllByRole('combobox')
      const pendingSelect = selects.find(s => s.value === 'pending')

      await user.selectOptions(pendingSelect, 'confirmed')

      await waitFor(() => {
        expect(screen.getByText('Order status updated successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Search and filtering', () => {
    it('renders search input', async () => {
      renderOrders()
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/search by order number/i)
        ).toBeInTheDocument()
      })
    })

    it('renders Filters button', async () => {
      renderOrders()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      })
    })

    it('search filters orders by order number', async () => {
      const user = userEvent.setup()
      renderOrders()

      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
        expect(screen.getByText(/ORD202602130138527c5ba7d4/)).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by order number/i)
      await user.type(searchInput, 'ORD2026021302212508c04929')

      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
        expect(screen.queryByText(/ORD202602130138527c5ba7d4/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no orders returned', async () => {
      server.use(
        http.get('*/api/orders', () => {
          return HttpResponse.json([])
        })
      )

      renderOrders()
      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument()
      })
    })
  })

  describe('Order Details toggle', () => {
    it('renders Order Details toggle button for each order', async () => {
      renderOrders()
      await waitFor(() => {
        const detailButtons = screen.getAllByText('Order Details')
        expect(detailButtons.length).toBe(2)
      })
    })
  })
})
