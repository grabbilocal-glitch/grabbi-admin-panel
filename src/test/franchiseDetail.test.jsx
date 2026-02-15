import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockAdminFranchises, mockOrders, mockFranchiseProducts } from './mocks/fixtures'
import FranchiseDetail from '../pages/FranchiseDetail'

const franchiseId = mockAdminFranchises[1].id // Grabbi Camden
const franchise = mockAdminFranchises[1]

function renderFranchiseDetail(id = franchiseId) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/franchises/${id}`]}>
        <Routes>
          <Route path="/franchises/:id" element={<FranchiseDetail />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('FranchiseDetail Page', () => {
  describe('View mode details', () => {
    it('renders franchise name as heading', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('Grabbi Camden')).toBeInTheDocument()
      })
    })

    it('displays franchise address and city info', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText(/Camden High St/)).toBeInTheDocument()
      })
    })

    it('displays Active badge for active franchise', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('shows delivery settings in view mode', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        // 'Delivery Radius' appears in both the stats card and delivery settings section
        const radiusElements = screen.getAllByText('Delivery Radius')
        expect(radiusElements.length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('Delivery Fee')).toBeInTheDocument()
        expect(screen.getByText('Free Delivery Minimum')).toBeInTheDocument()
      })
    })
  })

  describe('Edit mode toggle', () => {
    it('shows Edit Franchise button in view mode', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit franchise/i })).toBeInTheDocument()
      })
    })

    it('toggles to edit mode when Edit Franchise is clicked', async () => {
      const user = userEvent.setup()
      renderFranchiseDetail()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit franchise/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })
    })
  })

  describe('Map display', () => {
    it('renders map container in view mode for franchise with coordinates', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('Grabbi Camden')).toBeInTheDocument()
      })
      // The map is mocked in setup.js to render a div with data-testid="map-container"
      await waitFor(() => {
        const maps = screen.getAllByTestId('map-container')
        expect(maps.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Save changes', () => {
    it('saves changes and shows success toast', async () => {
      const user = userEvent.setup()
      renderFranchiseDetail()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit franchise/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(screen.getByText('Franchise updated successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Franchise orders section', () => {
    it('renders Franchise Orders section with order data', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('Franchise Orders')).toBeInTheDocument()
      })
      await waitFor(() => {
        expect(screen.getByText(/ORD2026021302212508c04929/)).toBeInTheDocument()
      })
    })
  })

  describe('Products section', () => {
    it('renders Products section with product data', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        const productsHeadings = screen.getAllByText('Products')
        expect(productsHeadings.length).toBeGreaterThanOrEqual(1)
      })
      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
        expect(screen.getByText('Almond Milk')).toBeInTheDocument()
      })
    })
  })

  describe('Staff section', () => {
    it('renders Staff Members section', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('Staff Members')).toBeInTheDocument()
      })
    })

    it('shows empty staff message when no staff', async () => {
      renderFranchiseDetail()
      await waitFor(() => {
        expect(screen.getByText('No staff members assigned')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel edit', () => {
    it('reverts to view mode when Cancel is clicked', async () => {
      const user = userEvent.setup()
      renderFranchiseDetail()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /edit franchise/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit franchise/i })).toBeInTheDocument()
      })
    })
  })
})
