import { http, HttpResponse } from 'msw'
import {
  mockAdminProducts,
  mockProductsExport,
  mockOrders,
  mockOrderStatusUpdateResponse,
  mockCategories,
  mockSubcategories,
  mockAdminFranchises,
  mockCreateFranchiseResponse,
  mockFranchiseProducts,
  mockAdminLoginResponse,
  mockPromotions,
} from './fixtures'

export const handlers = [
  // ─── Auth ──────────────────────────────────────────────────────────
  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.password === 'wrongpassword') {
      return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    return HttpResponse.json(mockAdminLoginResponse)
  }),

  // ─── Admin Products ────────────────────────────────────────────────
  http.get('*/api/admin/products/export', () => {
    return HttpResponse.json(mockProductsExport)
  }),

  http.get('*/api/admin/products', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    return HttpResponse.json({
      ...mockAdminProducts,
      page,
      limit,
    })
  }),

  http.post('*/api/admin/products', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockAdminProducts.products[0],
      ...body,
      id: 'new-product-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('*/api/admin/products/:id', async ({ request, params }) => {
    const body = await request.json()
    const existing = mockAdminProducts.products.find(p => p.id === params.id) || mockAdminProducts.products[0]
    return HttpResponse.json({ ...existing, ...body })
  }),

  http.delete('*/api/admin/products/:id', () => {
    return HttpResponse.json({ message: 'Product deleted successfully' })
  }),

  // ─── Categories ────────────────────────────────────────────────────
  http.get('*/api/categories', () => {
    return HttpResponse.json(mockCategories)
  }),

  http.post('*/api/categories', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-category-id',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('*/api/categories/:id', async ({ request, params }) => {
    const body = await request.json()
    const existing = mockCategories.find(c => c.id === params.id) || mockCategories[0]
    return HttpResponse.json({ ...existing, ...body })
  }),

  http.delete('*/api/categories/:id', () => {
    return HttpResponse.json({ message: 'Category deleted successfully' })
  }),

  // ─── Subcategories ─────────────────────────────────────────────────
  http.get('*/api/subcategories', () => {
    return HttpResponse.json(mockSubcategories)
  }),

  // ─── Admin Franchises ──────────────────────────────────────────────
  http.get('*/api/admin/franchises', () => {
    return HttpResponse.json(mockAdminFranchises)
  }),

  http.post('*/api/admin/franchises', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockCreateFranchiseResponse,
      ...body,
    }, { status: 201 })
  }),

  http.put('*/api/admin/franchises/:id', async ({ request, params }) => {
    const body = await request.json()
    const existing = mockAdminFranchises.find(f => f.id === params.id) || mockAdminFranchises[1]
    return HttpResponse.json({ ...existing, ...body })
  }),

  http.delete('*/api/admin/franchises/:id', () => {
    return HttpResponse.json({ message: 'Franchise deleted successfully' })
  }),

  http.get('*/api/admin/franchises/:id/orders', () => {
    return HttpResponse.json(mockOrders)
  }),

  // ─── Orders ────────────────────────────────────────────────────────
  http.get('*/api/orders', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json(mockOrders)
  }),

  http.put('*/api/admin/orders/:id/status', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      ...mockOrderStatusUpdateResponse,
      id: params.id,
      status: body.status,
    })
  }),

  // ─── Promotions ────────────────────────────────────────────────────
  http.get('*/api/admin/promotions', () => {
    return HttpResponse.json(mockPromotions)
  }),

  http.get('*/api/promotions', () => {
    return HttpResponse.json(mockPromotions)
  }),

  http.post('*/api/admin/promotions', async ({ request }) => {
    return HttpResponse.json({
      id: 'new-promo-id',
      title: 'New Promotion',
      description: 'New promo description',
      image: '',
      is_active: true,
      product_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('*/api/admin/promotions/:id', async ({ request, params }) => {
    const existing = mockPromotions.find(p => p.id === params.id) || mockPromotions[0]
    return HttpResponse.json({ ...existing, title: 'Updated Promotion' })
  }),

  http.delete('*/api/admin/promotions/:id', () => {
    return HttpResponse.json({ message: 'Promotion deleted successfully' })
  }),

  // ─── Admin Categories & Subcategories ────────────────────────────
  http.post('*/api/admin/categories', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-category-id',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('*/api/admin/categories/:id', async ({ request, params }) => {
    const body = await request.json()
    const existing = mockCategories.find(c => c.id === params.id) || mockCategories[0]
    return HttpResponse.json({ ...existing, ...body })
  }),

  http.delete('*/api/admin/categories/:id', () => {
    return HttpResponse.json({ message: 'Category deleted successfully' })
  }),

  http.post('*/api/admin/subcategories', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'new-subcategory-id',
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('*/api/admin/subcategories/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'sub-id', ...body })
  }),

  http.delete('*/api/admin/subcategories/:id', () => {
    return HttpResponse.json({ message: 'Subcategory deleted successfully' })
  }),

  // ─── Single Franchise ────────────────────────────────────────────
  http.get('*/api/admin/franchises/:id', ({ params }) => {
    const found = mockAdminFranchises.find(f => f.id === params.id)
    if (found) {
      return HttpResponse.json(found)
    }
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  // ─── Franchise Products (public) ───────────────────────────────────
  http.get('*/api/franchises/:id/products', () => {
    return HttpResponse.json(mockFranchiseProducts)
  }),
]
