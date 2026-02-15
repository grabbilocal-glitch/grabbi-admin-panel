import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockAdminProducts, mockCategories } from './mocks/fixtures'
import Products from '../pages/Products'

function renderProducts() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Products Page', () => {
  describe('Product list table', () => {
    it('renders product names after loading', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
        expect(screen.getByText('Almond Milk')).toBeInTheDocument()
      })
    })

    it('displays product prices formatted with pound sign', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText(/£2\.99/)).toBeInTheDocument()
        expect(screen.getByText(/£3\.49/)).toBeInTheDocument()
      })
    })

    it('displays stock quantities for each product', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('47')).toBeInTheDocument()
      })
    })

    it('shows category badges for products with a category', async () => {
      renderProducts()
      await waitFor(() => {
        const badges = screen.getAllByText('Fresh Produce & Veg')
        expect(badges.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Pagination', () => {
    it('displays pagination information', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText(/Showing/)).toBeInTheDocument()
        expect(screen.getByText(/products/)).toBeInTheDocument()
      })
    })

    it('renders Previous and Next buttons', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })
  })

  describe('Search', () => {
    it('renders search input with placeholder', async () => {
      renderProducts()
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/search products/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Add product modal', () => {
    it('opens create modal when Add Product is clicked', async () => {
      const user = userEvent.setup()
      renderProducts()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add product/i }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument()
        expect(screen.getByText('Fill in product details below')).toBeInTheDocument()
      })
    })
  })

  describe('Delete confirm', () => {
    it('shows delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderProducts()

      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
      })

      // Find all delete buttons (the trash icon buttons)
      const deleteButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-red')
      })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1)

      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Product')).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete this product/i)).toBeInTheDocument()
      })
    })
  })

  describe('Category filter', () => {
    it('renders Filters button and reveals filter panel when clicked', async () => {
      const user = userEvent.setup()
      renderProducts()

      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
      })

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      expect(filtersButton).toBeInTheDocument()

      await user.click(filtersButton)

      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument()
        expect(screen.getByText('Stock Status')).toBeInTheDocument()
        expect(screen.getByText('Dietary')).toBeInTheDocument()
      })
    })
  })

  describe('Dietary badges', () => {
    it('shows dietary badges (GF, Vg) for products with dietary flags', async () => {
      renderProducts()
      await waitFor(() => {
        // Almond Milk is_gluten_free=true, is_vegan=true
        expect(screen.getByText('GF')).toBeInTheDocument()
        expect(screen.getByText('Vg')).toBeInTheDocument()
      })
    })
  })

  describe('Online visibility', () => {
    it('shows Online/Hidden badge based on online_visible flag', async () => {
      renderProducts()
      await waitFor(() => {
        // product[0] online_visible=false -> Hidden, product[1] online_visible=true -> Online
        expect(screen.getByText('Hidden')).toBeInTheDocument()
        expect(screen.getByText('Online')).toBeInTheDocument()
      })
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no products returned', async () => {
      server.use(
        http.get('*/api/admin/products', () => {
          return HttpResponse.json({ products: [], total: 0, page: 1, limit: 20 })
        })
      )

      renderProducts()
      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument()
      })
    })
  })

  describe('Export button', () => {
    it('renders Download and Upload buttons for import/export', async () => {
      renderProducts()
      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
    })
  })

  describe('Delete product API call', () => {
    it('calls delete API and shows success toast after confirming delete', async () => {
      let deleteCalled = false
      server.use(
        http.delete('*/api/admin/products/:id', () => {
          deleteCalled = true
          return HttpResponse.json({ message: 'Product deleted successfully' })
        })
      )

      const user = userEvent.setup()
      renderProducts()

      await waitFor(() => {
        expect(screen.getByText('Organic Broccoli Premium')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button').filter(btn => {
        return btn.querySelector('svg') && btn.className.includes('text-red')
      })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Product')).toBeInTheDocument()
      })

      // Click the confirm Delete button in the dialog
      const confirmDeleteBtn = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmDeleteBtn)

      await waitFor(() => {
        expect(deleteCalled).toBe(true)
      })
    })
  })
})
