import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockPromotions } from './mocks/fixtures'
import Promotions from '../pages/Promotions'

function renderPromotions() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Promotions />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Promotions Page', () => {
  describe('Promotion list', () => {
    it('renders promotion titles after loading', async () => {
      renderPromotions()
      await waitFor(() => {
        expect(screen.getByText('Spring Sale')).toBeInTheDocument()
        expect(screen.getByText('Winter Warmers')).toBeInTheDocument()
      })
    })

    it('displays promotion descriptions', async () => {
      renderPromotions()
      await waitFor(() => {
        expect(screen.getByText('20% off fresh produce')).toBeInTheDocument()
        expect(screen.getByText('Hot drinks 50% off')).toBeInTheDocument()
      })
    })

    it('shows Active/Inactive badges based on is_active flag', async () => {
      renderPromotions()
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })
  })

  describe('Create promotion modal', () => {
    it('opens Add Promotion modal when button is clicked', async () => {
      const user = userEvent.setup()
      renderPromotions()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add promotion/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add promotion/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add promotion/i })).toBeInTheDocument()
      })
    })

    it('modal has title, description, image, and active fields', async () => {
      const user = userEvent.setup()
      renderPromotions()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add promotion/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add promotion/i }))

      await waitFor(() => {
        // Title and Description labels with required indicator
        expect(screen.getByText(/title/i)).toBeInTheDocument()
        expect(screen.getByText(/description/i)).toBeInTheDocument()
        // Active checkbox
        const activeCheckbox = screen.getByRole('checkbox')
        expect(activeCheckbox).toBeInTheDocument()
      })
    })
  })

  describe('Edit promotion', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderPromotions()

      await waitFor(() => {
        expect(screen.getByText('Spring Sale')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-indigo')
      })
      expect(editButtons.length).toBeGreaterThanOrEqual(1)

      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit promotion/i })).toBeInTheDocument()
      })
    })
  })

  describe('Delete promotion', () => {
    it('shows delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderPromotions()

      await waitFor(() => {
        expect(screen.getByText('Spring Sale')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-red')
      })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1)

      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Promotion')).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete this promotion/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancel modal', () => {
    it('closes modal when Cancel is clicked', async () => {
      const user = userEvent.setup()
      renderPromotions()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add promotion/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add promotion/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add promotion/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^cancel$/i }))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /add promotion/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no promotions returned', async () => {
      server.use(
        http.get('*/api/promotions', () => {
          return HttpResponse.json([])
        })
      )

      renderPromotions()
      await waitFor(() => {
        expect(screen.getByText('No promotions found')).toBeInTheDocument()
      })
    })
  })
})
