import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../contexts/ToastContext'
import { mockAdminProducts, mockCategories, mockSubcategories } from './mocks/fixtures'
import ProductFormModal from '../components/Products/ProductFormModal'

function renderModal(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    editingProduct: null,
    categories: mockCategories,
    subcategories: mockSubcategories,
    submitting: false,
    onSubmit: vi.fn(),
    ...props,
  }
  return {
    ...render(
      <ToastProvider>
        <ProductFormModal {...defaultProps} />
      </ToastProvider>
    ),
    ...defaultProps,
  }
}

describe('ProductFormModal Component', () => {
  describe('Create mode', () => {
    it('renders Add Product heading in create mode', () => {
      renderModal()
      expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument()
      expect(screen.getByText('Fill in product details below')).toBeInTheDocument()
    })

    it('renders Create button in create mode', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument()
    })
  })

  describe('Edit mode with prefill', () => {
    it('renders Edit Product heading in edit mode', () => {
      renderModal({ editingProduct: mockAdminProducts.products[0] })
      expect(screen.getByRole('heading', { name: /edit product/i })).toBeInTheDocument()
    })

    it('prefills item name in edit mode', () => {
      renderModal({ editingProduct: mockAdminProducts.products[0] })
      const nameInput = screen.getByDisplayValue('Organic Broccoli Premium')
      expect(nameInput).toBeInTheDocument()
    })

    it('renders Update button in edit mode', () => {
      renderModal({ editingProduct: mockAdminProducts.products[0] })
      expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument()
    })
  })

  describe('Category select', () => {
    it('renders main category dropdown with options', () => {
      renderModal()
      expect(screen.getByText('Select Main Category')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Beverages' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Fresh Produce & Veg' })).toBeInTheDocument()
    })
  })

  describe('Tabs', () => {
    it('renders tab buttons for general, pricing, inventory, details', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /general/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pricing/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument()
    })

    it('switches to pricing tab when clicked', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /pricing/i }))

      await waitFor(() => {
        expect(screen.getByText(/cost price/i)).toBeInTheDocument()
        expect(screen.getByText(/retail price/i)).toBeInTheDocument()
      })
    })
  })

  describe('Details tab - allergen and dietary fields', () => {
    it('shows allergen info and dietary checkboxes on details tab', async () => {
      const user = userEvent.setup()
      renderModal()

      await user.click(screen.getByRole('button', { name: /details/i }))

      await waitFor(() => {
        expect(screen.getByText('Allergen Information')).toBeInTheDocument()
        expect(screen.getByLabelText('Gluten Free')).toBeInTheDocument()
        expect(screen.getByLabelText('Vegetarian')).toBeInTheDocument()
        expect(screen.getByLabelText('Vegan')).toBeInTheDocument()
        expect(screen.getByLabelText('Age Restricted')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      const { onClose } = renderModal()

      await user.click(screen.getByRole('button', { name: /^cancel$/i }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Does not render when closed', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ToastProvider>
          <ProductFormModal
            isOpen={false}
            onClose={vi.fn()}
            editingProduct={null}
            categories={mockCategories}
            subcategories={mockSubcategories}
            submitting={false}
            onSubmit={vi.fn()}
          />
        </ToastProvider>
      )
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    })
  })
})
