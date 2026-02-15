import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockOrders } from './mocks/fixtures'
import OrderDetails from '../components/Orders/OrderDetails'

const order = mockOrders[1] // The order with Test Customer and 2 items

describe('OrderDetails Component', () => {
  describe('Order info display', () => {
    it('renders Order Details toggle button', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    it('does not render expanded content when collapsed', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      )
      expect(screen.queryByText('Customer Information')).not.toBeInTheDocument()
    })

    it('returns null when order is null', () => {
      const { container } = render(
        <OrderDetails
          order={null}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      )
      expect(container.innerHTML).toBe('')
    })
  })

  describe('Expanded view - items list', () => {
    it('shows order items when expanded', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Order Items')).toBeInTheDocument()
      // Order has 2 items - check quantity displays
      const quantities = screen.getAllByText(/Quantity:/)
      expect(quantities.length).toBe(2)
    })
  })

  describe('Customer info', () => {
    it('displays customer name and email when expanded', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Customer Information')).toBeInTheDocument()
      expect(screen.getByText('Test Customer')).toBeInTheDocument()
      expect(screen.getByText('testcustomer@grabbi.com')).toBeInTheDocument()
    })

    it('displays delivery address', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('123 Camden Rd, London NW1')).toBeInTheDocument()
    })

    it('displays payment method', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('card')).toBeInTheDocument()
    })
  })

  describe('Order summary', () => {
    it('displays order total and subtotal when expanded', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      expect(screen.getByText('Order Summary')).toBeInTheDocument()
      // subtotal: 12.46, delivery: 3.99, total: 16.45
      expect(screen.getByText(/£12\.46/)).toBeInTheDocument()
      expect(screen.getByText(/£3\.99/)).toBeInTheDocument()
      expect(screen.getByText(/£16\.45/)).toBeInTheDocument()
    })

    it('displays loyalty points when earned', () => {
      render(
        <OrderDetails
          order={order}
          isExpanded={true}
          onToggle={vi.fn()}
        />
      )
      // points_earned: 12
      expect(screen.getByText('Loyalty Points Earned:')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })

  describe('Toggle callback', () => {
    it('calls onToggle when the toggle button is clicked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()

      render(
        <OrderDetails
          order={order}
          isExpanded={false}
          onToggle={onToggle}
        />
      )

      await user.click(screen.getByText('Order Details'))

      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })
})
