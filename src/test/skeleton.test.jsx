import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Skeleton, { SkeletonCard, SkeletonList } from '../components/UI/Skeleton'

describe('Skeleton Component', () => {
  describe('Renders placeholder', () => {
    it('renders a single loading placeholder by default', () => {
      const { container } = render(<Skeleton className="h-4 w-full" />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('bg-gray-200')
      expect(skeleton).toHaveClass('rounded')
    })

    it('renders multiple lines when lines prop is greater than 1', () => {
      const { container } = render(<Skeleton lines={3} className="h-4" />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })

    it('renders a screen-reader accessible Loading text', () => {
      render(<Skeleton />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className to the skeleton element', () => {
      const { container } = render(<Skeleton className="h-8 w-1/2" />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toHaveClass('h-8')
      expect(skeleton).toHaveClass('w-1/2')
    })
  })

  describe('Animation presence', () => {
    it('has animate-pulse class for animation', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('has aria-hidden="true" for accessibility', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('[aria-hidden="true"]')
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('SkeletonCard', () => {
    it('renders a card with multiple skeleton lines', () => {
      const { container } = render(<SkeletonCard />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('SkeletonList', () => {
    it('renders the specified count of skeleton list items', () => {
      const { container } = render(<SkeletonList count={3} />)
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBe(3)
    })

    it('defaults to 5 items when no count is specified', () => {
      const { container } = render(<SkeletonList />)
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBe(5)
    })
  })
})
