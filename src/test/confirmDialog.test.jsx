import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../components/UI/ConfirmDialog'

describe('ConfirmDialog Component', () => {
  describe('Renders message', () => {
    it('renders title and message when isOpen is true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Delete Item"
          message="Are you sure you want to delete this item?"
        />
      )
      expect(screen.getByText('Delete Item')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Delete Item"
          message="Are you sure?"
        />
      )
      expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
    })
  })

  describe('Confirm action', () => {
    it('calls onConfirm and onClose when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      const onClose = vi.fn()

      render(
        <ConfirmDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Delete Item"
          message="Are you sure?"
          confirmText="Delete"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Delete' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cancel action', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onConfirm = vi.fn()

      render(
        <ConfirmDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Delete Item"
          message="Are you sure?"
          cancelText="Cancel"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalledTimes(1)
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Button colors', () => {
    it('renders with danger button color by default', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Delete"
          message="Confirm?"
          confirmText="Delete"
        />
      )
      const confirmBtn = screen.getByRole('button', { name: 'Delete' })
      expect(confirmBtn.className).toContain('bg-red')
    })

    it('renders with info button color when type is info', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Confirm"
          message="Proceed?"
          confirmText="Confirm"
          type="info"
        />
      )
      const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmBtn.className).toContain('bg-indigo')
    })
  })
})
