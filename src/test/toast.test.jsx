import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import Toast from '../components/UI/Toast'

describe('Toast Component', () => {
  describe('Rendering', () => {
    it('renders toast with the given message', () => {
      render(<Toast message="Operation successful" />)
      expect(screen.getByText('Operation successful')).toBeInTheDocument()
    })

    it('renders success toast with correct message', () => {
      render(<Toast type="success" message="Item saved" />)
      expect(screen.getByText('Item saved')).toBeInTheDocument()
    })

    it('renders error toast with correct message', () => {
      render(<Toast type="error" message="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('renders warning toast with correct message', () => {
      render(<Toast type="warning" message="Low stock alert" />)
      expect(screen.getByText('Low stock alert')).toBeInTheDocument()
    })

    it('renders info toast with correct message', () => {
      render(<Toast type="info" message="New update available" />)
      expect(screen.getByText('New update available')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has role="alert" attribute', () => {
      render(<Toast message="Alert message" />)
      const alertEl = screen.getByRole('alert')
      expect(alertEl).toBeInTheDocument()
    })

    it('has aria-live="assertive" attribute', () => {
      render(<Toast message="Live announcement" />)
      const alertEl = screen.getByRole('alert')
      expect(alertEl).toHaveAttribute('aria-live', 'assertive')
    })

    it('close button is focusable', () => {
      render(<Toast message="Closeable toast" />)
      // The close button (XMarkIcon) should be a button element
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Auto-close behavior', () => {
    it('calls onClose after duration elapses', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Auto closing" duration={1000} onClose={onClose} />)

      expect(onClose).not.toHaveBeenCalled()

      // Advance past the duration timer
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Advance past the 300ms animation delay
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(onClose).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('does not call onClose before duration', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Not yet" duration={3000} onClose={onClose} />)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(onClose).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('uses default duration of 3000ms', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Default timer" onClose={onClose} />)

      // At 2999ms it should not have closed
      act(() => {
        vi.advanceTimersByTime(2999)
      })
      expect(onClose).not.toHaveBeenCalled()

      // At 3000ms the close animation starts
      act(() => {
        vi.advanceTimersByTime(1)
      })

      // After 300ms animation delay it calls onClose
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onClose).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('respects custom duration', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Custom timer" duration={500} onClose={onClose} />)

      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(onClose).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(1)
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onClose).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('Manual close', () => {
    it('calls onClose when close button is clicked', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Click to close" duration={99999} onClose={onClose} />)

      // Use fireEvent instead of userEvent to avoid async timer issues
      const closeButton = screen.getAllByRole('button')[0]
      fireEvent.click(closeButton)

      // Advance past animation delay
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(onClose).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('hides toast after close button click', () => {
      vi.useFakeTimers()
      const onClose = vi.fn()

      render(<Toast message="Will disappear" duration={99999} onClose={onClose} />)

      expect(screen.getByText('Will disappear')).toBeInTheDocument()

      const closeButton = screen.getAllByRole('button')[0]
      fireEvent.click(closeButton)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByText('Will disappear')).not.toBeInTheDocument()

      vi.useRealTimers()
    })
  })
})
