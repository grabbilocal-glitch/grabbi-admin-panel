import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../utils/api'
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, CubeIcon, ExclamationTriangleIcon, GlobeAltIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import ProductImportExport from '../components/Products/ProductImportExport'
import ProductFormModal from '../components/Products/ProductFormModal'

export default function Products() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, productId: null })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dietaryFilter, setDietaryFilter] = useState('all')
  const [franchiseFilter, setFranchiseFilter] = useState('')
  const [franchises, setFranchises] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [pageLimit] = useState(20)
  const [batchProgress, setBatchProgress] = useState({
    isOpen: false,
    jobId: null,
    status: 'pending',
    progress: 0,
    processed: 0,
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    errors: []
  })

  const fetchCategories = useCallback(async () => {
    try {
      const [categoriesRes, subcategoriesRes, franchisesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/admin/franchises'),
      ])
      setCategories(categoriesRes.data || [])
      setSubcategories(subcategoriesRes.data || [])
      setFranchises(franchisesRes.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch categories')
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [categoryFilter, stockFilter, statusFilter, dietaryFilter, franchiseFilter])

  // searchTerm is read via ref to avoid re-fetching on every keystroke.
  // Search is triggered explicitly by pressing Enter or changing filters/page.
  const searchTermRef = useRef(searchTerm)
  searchTermRef.current = searchTerm

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', pageLimit.toString())
      params.append('page', currentPage.toString())
      if (searchTermRef.current) params.append('search', searchTermRef.current)
      if (categoryFilter) params.append('category_id', categoryFilter)
      if (franchiseFilter) params.append('franchise_id', franchiseFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await api.get(`/admin/products?${params.toString()}`)
      let fetchedProducts = response.data.products || []
      const total = response.data.total || 0

      if (stockFilter === 'in_stock') {
        fetchedProducts = fetchedProducts.filter(p => (p.stock_quantity || p.stock || 0) > 0)
      } else if (stockFilter === 'out_of_stock') {
        fetchedProducts = fetchedProducts.filter(p => (p.stock_quantity || p.stock || 0) === 0)
      } else if (stockFilter === 'low_stock') {
        fetchedProducts = fetchedProducts.filter(p => {
          const stock = p.stock_quantity || p.stock || 0
          const reorder = p.reorder_level || 0
          return stock > 0 && stock <= reorder
        })
      }

      if (statusFilter !== 'all') {
        fetchedProducts = fetchedProducts.filter(p => p.status === statusFilter)
      }

      if (dietaryFilter === 'gluten_free') {
        const filtered = fetchedProducts.filter(p => {
          const value = Boolean(p.is_gluten_free)
          return value
        })
        fetchedProducts = filtered
      } else if (dietaryFilter === 'vegetarian') {
        const filtered = fetchedProducts.filter(p => {
          const value = Boolean(p.is_vegetarian)
          return value
        })
        fetchedProducts = filtered
      } else if (dietaryFilter === 'vegan') {
        const filtered = fetchedProducts.filter(p => {
          const value = Boolean(p.is_vegan)
          return value
        })
        fetchedProducts = filtered
      }

      setProducts(fetchedProducts)
      setTotalProducts(total)
    } catch (error) {
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [currentPage, categoryFilter, franchiseFilter, statusFilter, dietaryFilter, stockFilter, pageLimit, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const fetchAllProducts = async () => {
    try {
      const response = await api.get('/admin/products/export')
      const allProducts = Array.isArray(response.data) ? response.data : (response.data.products || [])

      setProducts(allProducts.slice(0, pageLimit))
      setTotalProducts(allProducts.length)
      setCurrentPage(1)
      toast.success(`Product list updated: ${allProducts.length} products`)
    } catch (error) {
      toast.error(error.message || 'Failed to refresh products')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.productId) return

    try {
      await api.delete(`/admin/products/${deleteConfirm.productId}`)
      fetchProducts()
      toast.success('Product deleted successfully')
      setDeleteConfirm({ isOpen: false, productId: null })
    } catch (error) {
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
  }

  const isPromotionActive = (product) => {
    if (!product.promotion_price || !product.promotion_start || !product.promotion_end) {
      return false
    }
    const now = new Date()
    const start = new Date(product.promotion_start)
    const end = new Date(product.promotion_end)
    return now >= start && now <= end
  }

  const getCurrentPrice = (product) => {
    if (isPromotionActive(product)) {
      return product.promotion_price
    }
    return product.retail_price || product.price
  }


  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <div className="flex space-x-3">
            <ProductImportExport
              categories={categories}
              subcategories={subcategories}
              onExportComplete={(data) => {
                if (data.loading !== undefined) setLoading(data.loading)
              }}
              onImportComplete={(data) => {
                if (data.loading !== undefined) setLoading(data.loading)
                if (data.batchProgress) {
                  setBatchProgress(prev => ({ ...prev, ...data.batchProgress }))
                }
                if (data.status === 'completed' && data.shouldRefresh) {
                  fetchAllProducts()
                }
                if (data.status === 'close-modal') {
                  setBatchProgress(prev => ({ ...prev, isOpen: false }))
                }
              }}
            />
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products... (Press Enter to search)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1)
                  fetchProducts()
                }
              }}
              className="input-field pl-12"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-indigo-50 border-indigo-300' : ''}`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="card p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field">
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="input-field">
                  <option value="all">All</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">At/Below Reorder Level</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dietary</label>
                <select value={dietaryFilter} onChange={(e) => setDietaryFilter(e.target.value)} className="input-field">
                  <option value="all">All</option>
                  <option value="gluten_free">Gluten Free</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              {franchises.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Franchise</label>
                  <select value={franchiseFilter} onChange={(e) => setFranchiseFilter(e.target.value)} className="input-field">
                    <option value="">All Franchises</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {(categoryFilter || franchiseFilter || stockFilter !== 'all' || statusFilter !== 'all' || dietaryFilter !== 'all' || searchTerm) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setCategoryFilter('')
                    setFranchiseFilter('')
                    setStockFilter('all')
                    setStatusFilter('all')
                    setDietaryFilter('all')
                    setSearchTerm('')
                  }}
                  className="btn-secondary text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <CubeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No products found</p>
          <p className="text-gray-400 text-sm mt-2">Get started by adding your first product</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {products.map((product) => {
              const stock = product.stock_quantity || product.stock || 0
              const reorder = product.reorder_level || 0
              const isLow = stock <= reorder && stock > 0
              const promotionActive = isPromotionActive(product)
              const currentPrice = getCurrentPrice(product)
              
              return (
                <li key={product.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images.find(img => img.is_primary)?.image_url || product.images[0].image_url}
                          alt={product.item_name || product.name}
                          className="h-20 w-20 object-cover rounded-xl mr-4 shadow-sm border border-gray-200"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl mr-4 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <CubeIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {product.item_name || product.name}
                          </p>
                          {product.online_visible !== undefined && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.online_visible ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {product.online_visible ? (
                                <>
                                  <GlobeAltIcon className="h-3 w-3 mr-1" />
                                  Online
                                </>
                              ) : (
                                <>
                                  <EyeSlashIcon className="h-3 w-3 mr-1" />
                                  Hidden
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">
                            Price: <span className={`font-semibold ${promotionActive ? 'text-green-600' : 'text-gray-900'}`}>
                              £{parseFloat(currentPrice).toFixed(2)}
                            </span>
                            {promotionActive && (
                              <span className="ml-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                Promo
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock: <span className={`font-medium ${stock === 0 ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
                              {stock}
                            </span>
                            {isLow && (
                              <span className="ml-1 text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded flex items-center">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-0.5" />
                                Reorder
                              </span>
                            )}
                          </p>
                        </div>
                        {product.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mt-1.5">
                            {product.category.name || product.category}
                          </span>
                        )}
                        {(product.is_gluten_free || product.is_vegetarian || product.is_vegan) && (
                          <div className="flex items-center gap-2 mt-1.5">
                            {product.is_gluten_free && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                GF
                              </span>
                            )}
                            {product.is_vegetarian && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                V
                              </span>
                            )}
                            {product.is_vegan && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                Vg
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id })} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-6 flex items-center justify-between card p-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageLimit) + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * pageLimit, totalProducts)}</span> of <span className="font-semibold text-gray-900">{totalProducts}</span> products
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
              Page {currentPage} of {Math.ceil(totalProducts / pageLimit) || 1}
            </span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(totalProducts / pageLimit)} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}

      <ProductFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        editingProduct={editingProduct}
        categories={categories}
        subcategories={subcategories}
        submitting={submitting}
        onSubmit={async (result) => {
          try {
            setSubmitting(true)
            if (editingProduct) {
              await api.put(`/admin/products/${editingProduct.id}`, result.data)
            } else {
              await api.post('/admin/products', result.data)
            }
            setShowModal(false)
            resetForm()
            fetchProducts()
            toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully')
          } catch (error) {
            toast.error(error.message || 'Failed to save product')
          } finally {
            setSubmitting(false)
          }
        }}
      />

      {batchProgress.isOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="batch-progress-title">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => {
                if (batchProgress.status === 'completed' || batchProgress.status === 'failed') {
                  setBatchProgress(prev => ({ ...prev, isOpen: false }))
                }
              }}
              aria-hidden="true"
            ></div>

            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full z-10" style={{ minWidth: '500px' }}>
              <div className="p-8">
                <div className="mb-6">
                  <h3 id="batch-progress-title" className="text-2xl font-bold text-gray-900 mb-2">
                    {batchProgress.status === 'pending' ? 'Processing Started' : 
                     batchProgress.status === 'processing' ? 'Processing Products...' :
                     batchProgress.status === 'completed' ? 'Batch Completed!' : 'Processing Failed'}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{batchProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${batchProgress.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{batchProgress.created}</div>
                      <div className="text-sm text-green-700">Created</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{batchProgress.updated}</div>
                      <div className="text-sm text-blue-700">Updated</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">{batchProgress.deleted}</div>
                      <div className="text-sm text-orange-700">Deleted</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{batchProgress.failed}</div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                  </div>
                </div>

                {batchProgress.errors && batchProgress.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Errors ({batchProgress.errors.length})</h4>
                    <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3">
                      <ul className="text-sm text-red-700 space-y-1">
                        {batchProgress.errors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="font-medium mr-2">Row {error.row}:</span>
                            <span>{Object.values(error.errors).join(', ')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {batchProgress.status === 'completed' || batchProgress.status === 'failed' ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setBatchProgress(prev => ({ ...prev, isOpen: false }))
                      }}
                      className="btn-primary"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing in background...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, productId: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}