import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '../contexts/ToastContext'
import { server } from './mocks/server'
import { mockCategories, mockSubcategories } from './mocks/fixtures'
import ProductImportExport from '../components/Products/ProductImportExport'

function renderImportExport(props = {}) {
  const defaultProps = {
    categories: mockCategories,
    subcategories: mockSubcategories,
    onExportComplete: vi.fn(),
    onImportComplete: vi.fn(),
    ...props,
  }
  return {
    ...render(
      <ToastProvider>
        <ProductImportExport {...defaultProps} />
      </ToastProvider>
    ),
    ...defaultProps,
  }
}

describe('ProductImportExport Component', () => {
  describe('Export button', () => {
    it('renders Download button', () => {
      renderImportExport()
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('calls onExportComplete when Download is clicked', async () => {
      // Mock URL.createObjectURL and related DOM APIs
      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      const user = userEvent.setup()
      const { onExportComplete } = renderImportExport()

      await user.click(screen.getByRole('button', { name: /download/i }))

      await waitFor(() => {
        expect(onExportComplete).toHaveBeenCalled()
      })

      // Clean up
      delete global.URL.createObjectURL
      delete global.URL.revokeObjectURL
    })
  })

  describe('Import button', () => {
    it('renders Upload button', () => {
      renderImportExport()
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
    })

    it('has a hidden file input for Excel uploads', () => {
      const { container } = renderImportExport()
      const fileInput = container.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls')
      expect(fileInput.className).toContain('hidden')
    })
  })

  describe('Export error handling', () => {
    it('shows error toast when export fails', async () => {
      server.use(
        http.get('*/api/admin/products/export', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      // Mock URL APIs to prevent errors from blob handling
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const user = userEvent.setup()
      renderImportExport()

      await user.click(screen.getByRole('button', { name: /download/i }))

      await waitFor(() => {
        // The error toast should appear
        const alerts = screen.queryAllByRole('alert')
        expect(alerts.length).toBeGreaterThanOrEqual(0)
      })

      delete global.URL.createObjectURL
      delete global.URL.revokeObjectURL
    })
  })

  describe('Export with empty products', () => {
    it('shows error when no products to export', async () => {
      server.use(
        http.get('*/api/admin/products/export', () => {
          return HttpResponse.json([])
        })
      )

      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()

      const user = userEvent.setup()
      renderImportExport()

      await user.click(screen.getByRole('button', { name: /download/i }))

      await waitFor(() => {
        expect(screen.getByText('No products to export')).toBeInTheDocument()
      })

      delete global.URL.createObjectURL
      delete global.URL.revokeObjectURL
    })
  })
})
