import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockCategories, mockSubcategories } from './mocks/fixtures'
import Categories from '../pages/Categories'

function renderCategories() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Categories Page', () => {
  describe('Category list', () => {
    it('renders category names after loading', async () => {
      renderCategories()
      await waitFor(() => {
        expect(screen.getByText('Beverages')).toBeInTheDocument()
        expect(screen.getByText('Fresh Produce & Veg')).toBeInTheDocument()
      })
    })

    it('displays category descriptions', async () => {
      renderCategories()
      await waitFor(() => {
        expect(screen.getByText('Drinks and beverages')).toBeInTheDocument()
        expect(screen.getByText('Fresh fruits and vegetables')).toBeInTheDocument()
      })
    })
  })

  describe('Create category modal', () => {
    it('opens Add Category modal when button is clicked', async () => {
      const user = userEvent.setup()
      renderCategories()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add category/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add category/i })).toBeInTheDocument()
        expect(screen.getByText('Fill in the category details below')).toBeInTheDocument()
      })
    })

    it('submits create form and shows success toast', async () => {
      const user = userEvent.setup()
      renderCategories()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add category/i }))

      await waitFor(() => {
        expect(screen.getByText('Fill in the category details below')).toBeInTheDocument()
      })

      // Fill in form
      const nameInput = screen.getAllByRole('textbox').find(input => input.getAttribute('required') !== null)
      await user.type(nameInput, 'New Category')

      await user.click(screen.getByRole('button', { name: /^create$/i }))

      await waitFor(() => {
        expect(screen.getByText('Category created successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Edit category', () => {
    it('opens edit modal when pencil button is clicked on a category', async () => {
      const user = userEvent.setup()
      renderCategories()

      await waitFor(() => {
        expect(screen.getByText('Beverages')).toBeInTheDocument()
      })

      // Find edit buttons (pencil icon buttons with indigo color)
      const editButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-indigo')
      })
      expect(editButtons.length).toBeGreaterThanOrEqual(1)

      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit category/i })).toBeInTheDocument()
      })
    })
  })

  describe('Delete category', () => {
    it('shows delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderCategories()

      await waitFor(() => {
        expect(screen.getByText('Beverages')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-red')
      })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1)

      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Category')).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete this category/i)).toBeInTheDocument()
      })
    })
  })

  describe('Subcategories display', () => {
    it('shows subcategories under their parent category', async () => {
      renderCategories()
      await waitFor(() => {
        // Fresh Vegetables is a subcategory under Fresh Produce & Veg
        expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument()
      })
    })

    it('shows subcategory count for categories with subcategories', async () => {
      renderCategories()
      await waitFor(() => {
        // Fresh Produce & Veg has 1 subcategory
        expect(screen.getByText('1 subcategory')).toBeInTheDocument()
      })
    })
  })

  describe('Add Sub Category', () => {
    it('opens Add Sub Category modal when button is clicked', async () => {
      const user = userEvent.setup()
      renderCategories()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add sub category/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add sub category/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add sub category/i })).toBeInTheDocument()
        expect(screen.getByText('Fill in the subcategory details below')).toBeInTheDocument()
      })
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no categories returned', async () => {
      server.use(
        http.get('*/api/categories', () => {
          return HttpResponse.json([])
        })
      )

      renderCategories()
      await waitFor(() => {
        expect(screen.getByText('No categories found')).toBeInTheDocument()
      })
    })
  })
})
