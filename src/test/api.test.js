import { describe, it, expect } from 'vitest'
import { api } from '../utils/api'
import {
  mockAdminProducts,
  mockOrders,
  mockCategories,
  mockAdminFranchises,
  mockFranchiseProducts,
} from './mocks/fixtures'

describe('Admin Panel API Integration', () => {
  describe('GET /api/admin/products', () => {
    it('returns paginated products with total count', async () => {
      const response = await api.get('/admin/products')
      const data = response.data
      expect(data).toHaveProperty('products')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.products)).toBe(true)
      expect(data.total).toBe(2)
    })

    it('each product has required fields', async () => {
      const response = await api.get('/admin/products')
      const product = response.data.products[0]
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('sku')
      expect(product).toHaveProperty('item_name')
      expect(product).toHaveProperty('retail_price')
      expect(product).toHaveProperty('stock_quantity')
      expect(product).toHaveProperty('category')
      expect(product).toHaveProperty('images')
    })
  })

  describe('GET /api/admin/products/export', () => {
    it('returns array of all products for export', async () => {
      const response = await api.get('/admin/products/export')
      expect(Array.isArray(response.data)).toBe(true)
    })
  })

  describe('GET /api/orders', () => {
    it('returns array of orders', async () => {
      const response = await api.get('/orders')
      const orders = response.data
      expect(Array.isArray(orders)).toBe(true)
      expect(orders.length).toBeGreaterThan(0)
    })

    it('each order has required fields', async () => {
      const response = await api.get('/orders')
      const order = response.data[0]
      expect(order).toHaveProperty('id')
      expect(order).toHaveProperty('order_number')
      expect(order).toHaveProperty('status')
      expect(order).toHaveProperty('total')
      expect(order).toHaveProperty('created_at')
      expect(order).toHaveProperty('user')
    })
  })

  describe('GET /api/categories', () => {
    it('returns array of categories', async () => {
      const response = await api.get('/categories')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('id')
      expect(response.data[0]).toHaveProperty('name')
    })
  })

  describe('GET /api/admin/franchises', () => {
    it('returns array of franchises with owner info', async () => {
      const response = await api.get('/admin/franchises')
      const franchises = response.data
      expect(Array.isArray(franchises)).toBe(true)
      expect(franchises.length).toBe(2)
      expect(franchises[0]).toHaveProperty('id')
      expect(franchises[0]).toHaveProperty('name')
      expect(franchises[0]).toHaveProperty('slug')
      expect(franchises[0]).toHaveProperty('delivery_radius')
      expect(franchises[0]).toHaveProperty('delivery_fee')
      expect(franchises[0]).toHaveProperty('is_active')
      expect(franchises[0]).toHaveProperty('owner')
    })
  })

  describe('GET /api/admin/franchises/:id/orders', () => {
    it('returns orders for specific franchise', async () => {
      const response = await api.get(`/admin/franchises/${mockAdminFranchises[1].id}/orders`)
      expect(Array.isArray(response.data)).toBe(true)
    })
  })

  describe('PUT /api/admin/franchises/:id', () => {
    it('updates franchise settings and returns updated data', async () => {
      const response = await api.put(`/admin/franchises/${mockAdminFranchises[1].id}`, {
        delivery_fee: 4.49,
      })
      expect(response.data).toHaveProperty('delivery_fee')
      expect(response.data.delivery_fee).toBe(4.49)
    })
  })

  describe('PUT /api/admin/orders/:id/status', () => {
    it('updates order status', async () => {
      const response = await api.put(`/admin/orders/${mockOrders[0].id}/status`, {
        status: 'preparing',
      })
      expect(response.data.status).toBe('preparing')
    })
  })

  describe('GET /api/franchises/:id/products', () => {
    it('returns franchise products with stock and pricing', async () => {
      const response = await api.get(`/franchises/${mockAdminFranchises[1].id}/products`)
      const products = response.data
      expect(Array.isArray(products)).toBe(true)
      expect(products[0]).toHaveProperty('item_name')
      expect(products[0]).toHaveProperty('retail_price')
      expect(products[0]).toHaveProperty('stock_quantity')
    })
  })
})
