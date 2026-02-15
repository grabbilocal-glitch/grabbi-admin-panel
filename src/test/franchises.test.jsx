import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockAdminFranchises, mockCreateFranchiseResponse } from './mocks/fixtures'
import Franchises from '../pages/Franchises'

function renderFranchises() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Franchises />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Franchises Page', () => {
  describe('Loading state', () => {
    it('shows heading and skeleton while loading', () => {
      renderFranchises()
      expect(screen.getByText('Franchises')).toBeInTheDocument()
    })
  })

  describe('Franchise list rendering', () => {
    it('renders franchise names from API data', async () => {
      renderFranchises()
      await waitFor(() => {
        expect(screen.getByText('Grabbi Main Store')).toBeInTheDocument()
        expect(screen.getByText('Grabbi Camden')).toBeInTheDocument()
      })
    })

    it('displays franchise cities', async () => {
      renderFranchises()
      await waitFor(() => {
        // Both franchises are in London
        const londons = screen.getAllByText('London')
        expect(londons.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('displays owner emails', async () => {
      renderFranchises()
      await waitFor(() => {
        expect(screen.getByText('admin@grabbi.com')).toBeInTheDocument()
        expect(screen.getByText('owner@camden.grabbi.com')).toBeInTheDocument()
      })
    })

    it('displays order counts', async () => {
      renderFranchises()
      await waitFor(() => {
        // mockAdminFranchises[0].order_count = 0, [1].order_count = 1
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('shows Active badge for active franchises', async () => {
      renderFranchises()
      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active')
        expect(activeBadges.length).toBe(2) // Both franchises are active
      })
    })

    it('renders table headers', async () => {
      renderFranchises()
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('City')).toBeInTheDocument()
        expect(screen.getByText('Owner Email')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Created')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
      })
    })

    it('franchise names are links to detail page', async () => {
      renderFranchises()
      await waitFor(() => {
        const mainStoreLink = screen.getByText('Grabbi Main Store').closest('a')
        expect(mainStoreLink).toHaveAttribute('href', `/franchises/${mockAdminFranchises[0].id}`)

        const camdenLink = screen.getByText('Grabbi Camden').closest('a')
        expect(camdenLink).toHaveAttribute('href', `/franchises/${mockAdminFranchises[1].id}`)
      })
    })
  })

  describe('Search', () => {
    it('renders search input', async () => {
      renderFranchises()
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/search by name, city, or owner email/i)
        ).toBeInTheDocument()
      })
    })

    it('filters franchises by name when searching', async () => {
      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByText('Grabbi Main Store')).toBeInTheDocument()
        expect(screen.getByText('Grabbi Camden')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by name, city, or owner email/i)
      await user.type(searchInput, 'Camden')

      await waitFor(() => {
        expect(screen.getByText('Grabbi Camden')).toBeInTheDocument()
        expect(screen.queryByText('Grabbi Main Store')).not.toBeInTheDocument()
      })
    })
  })

  describe('Create franchise form', () => {
    it('renders Add Franchise button', async () => {
      renderFranchises()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })
    })

    it('opens create modal when Add Franchise is clicked', async () => {
      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add franchise/i }))

      await waitFor(() => {
        // The modal heading is an h2, and the submit button also says "Create Franchise"
        // Use the subtext to confirm modal opened
        expect(screen.getByText('Fill in the details to create a new franchise')).toBeInTheDocument()
        // Confirm the h2 heading exists
        expect(screen.getByRole('heading', { name: 'Create Franchise' })).toBeInTheDocument()
      })
    })

    it('modal has all required form fields', async () => {
      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add franchise/i }))

      await waitFor(() => {
        // Franchise Info
        expect(screen.getByPlaceholderText('e.g. Grabbi Manchester')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g. grabbi-manchester')).toBeInTheDocument()

        // Owner Details
        expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('owner@example.com')).toBeInTheDocument()

        // Address
        expect(screen.getByPlaceholderText('Street address')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g. Manchester')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g. M1 1AA')).toBeInTheDocument()
      })
    })

    it('submits create form and triggers API call', async () => {
      let createCalled = false
      let capturedPayload = null

      server.use(
        http.post('*/api/admin/franchises', async ({ request }) => {
          const body = await request.json()
          createCalled = true
          capturedPayload = body
          return HttpResponse.json(mockCreateFranchiseResponse, { status: 201 })
        })
      )

      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add franchise/i }))

      await waitFor(() => {
        expect(screen.getByText('Fill in the details to create a new franchise')).toBeInTheDocument()
      })

      // Fill required fields
      await user.type(screen.getByPlaceholderText('e.g. Grabbi Manchester'), 'Test Franchise')
      await user.type(screen.getByPlaceholderText('e.g. grabbi-manchester'), 'test-franchise')
      await user.type(screen.getByPlaceholderText('Full name'), 'Test Owner')
      await user.type(screen.getByPlaceholderText('owner@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/minimum 8 characters/i), 'testpassword123')
      await user.type(screen.getByPlaceholderText('Street address'), '123 Test St')
      await user.type(screen.getByPlaceholderText('e.g. Manchester'), 'Manchester')
      await user.type(screen.getByPlaceholderText('e.g. M1 1AA'), 'M1 1AA')

      // Submit using the submit button (type="submit")
      const submitButton = screen.getByRole('button', { name: /create franchise/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(createCalled).toBe(true)
        expect(capturedPayload.name).toBe('Test Franchise')
        expect(capturedPayload.slug).toBe('test-franchise')
        expect(capturedPayload.owner_email).toBe('test@example.com')
      })
    })

    it('shows success toast after creating franchise', async () => {
      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add franchise/i }))

      await waitFor(() => {
        expect(screen.getByText('Fill in the details to create a new franchise')).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText('e.g. Grabbi Manchester'), 'Test Franchise')
      await user.type(screen.getByPlaceholderText('e.g. grabbi-manchester'), 'test-franchise')
      await user.type(screen.getByPlaceholderText('Full name'), 'Test Owner')
      await user.type(screen.getByPlaceholderText('owner@example.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText(/minimum 8 characters/i), 'testpassword123')
      await user.type(screen.getByPlaceholderText('Street address'), '123 Test St')
      await user.type(screen.getByPlaceholderText('e.g. Manchester'), 'Manchester')
      await user.type(screen.getByPlaceholderText('e.g. M1 1AA'), 'M1 1AA')

      await user.click(screen.getByRole('button', { name: /create franchise/i }))

      await waitFor(() => {
        expect(screen.getByText('Franchise created successfully')).toBeInTheDocument()
      })
    })

    it('closes modal on Cancel', async () => {
      const user = userEvent.setup()
      renderFranchises()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add franchise/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add franchise/i }))

      await waitFor(() => {
        expect(screen.getByText('Fill in the details to create a new franchise')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^cancel$/i }))

      await waitFor(() => {
        expect(screen.queryByText('Fill in the details to create a new franchise')).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no franchises returned', async () => {
      server.use(
        http.get('*/api/admin/franchises', () => {
          return HttpResponse.json([])
        })
      )

      renderFranchises()
      await waitFor(() => {
        expect(screen.getByText('No franchises found')).toBeInTheDocument()
      })
    })
  })
})
