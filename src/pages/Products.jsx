import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, CubeIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'

export default function Products() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, productId: null })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [pageLimit] = useState(20)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: null,
    imageUrl: '',
    category_id: '',
    stock: '',
    description: '',
    pack_size: '',
    is_vegan: false,
    is_gluten_free: false,
    brand: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, categoryFilter, stockFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts()
    }, searchTerm ? 300 : 0) // Only debounce search, not filters
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, categoryFilter, stockFilter, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', pageLimit.toString())
      params.append('page', currentPage.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter) params.append('category_id', categoryFilter)

      const response = await api.get(`/admin/products?${params.toString()}`)
      let fetchedProducts = response.data.products || []
      const total = response.data.total || 0

      // Apply stock filter client-side
      if (stockFilter === 'in_stock') {
        fetchedProducts = fetchedProducts.filter(p => p.stock > 0)
      } else if (stockFilter === 'out_of_stock') {
        fetchedProducts = fetchedProducts.filter(p => p.stock === 0)
      } else if (stockFilter === 'low_stock') {
        fetchedProducts = fetchedProducts.filter(p => p.stock > 0 && p.stock < 10)
      }

      setProducts(fetchedProducts)
      setTotalProducts(total)
    } catch (error) {
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required'
    if (!formData.category_id) errors.category_id = 'Category is required'
    if (formData.stock === '' || parseInt(formData.stock) < 0) errors.stock = 'Valid stock quantity is required'
    if (!formData.image && !editingProduct) errors.image = 'Product image is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      setSubmitting(true)

      const data = new FormData()
      data.append('name', formData.name)
      data.append('price', formData.price)
      data.append('stock', formData.stock)
      data.append('category_id', formData.category_id)
      data.append('description', formData.description)
      data.append('pack_size', formData.pack_size)
      data.append('brand', formData.brand)
      data.append('is_vegan', formData.is_vegan)
      data.append('is_gluten_free', formData.is_gluten_free)

      if (formData.image) {
        data.append('image', formData.image)
      }

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, data)
      } else {
        await api.post('/admin/products', data)
      }

      setShowModal(false)
      resetForm()
      setFormErrors({})
      fetchProducts()
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      image: null, 
      imageUrl: product.image,
      category_id: product.category_id,
      stock: product.stock,
      description: product.description,
      pack_size: product.pack_size,
      is_vegan: product.is_vegan,
      is_gluten_free: product.is_gluten_free,
      brand: product.brand,
    })
    setShowModal(true)
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

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      image: '',
      category_id: '',
      stock: '',
      description: '',
      pack_size: '',
      is_vegan: false,
      is_gluten_free: false,
      brand: '',
    })
    setEditingProduct(null)
    setFormErrors({})
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

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock (&lt;10)</option>
                </select>
              </div>
              {(categoryFilter || stockFilter !== 'all' || searchTerm) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCategoryFilter('')
                      setStockFilter('all')
                      setSearchTerm('')
                    }}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
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
            {products.map((product) => (
              <li key={product.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-20 object-cover rounded-xl mr-4 shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl mr-4 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <CubeIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        £{product.price} • Stock: <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>{product.stock}</span>
                      </p>
                      {product.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mt-1.5">
                          {product.category.name || product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      aria-label={`Edit ${product.name}`}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, productId: product.id })}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      aria-label={`Delete ${product.name}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-6 flex items-center justify-between card p-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageLimit) + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * pageLimit, totalProducts)}</span> of <span className="font-semibold text-gray-900">{totalProducts}</span> products
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
              Page {currentPage} of {Math.ceil(totalProducts / pageLimit) || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(totalProducts / pageLimit)}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowModal(false)}
              aria-hidden="true"
            ></div>

            <div className="modal-content relative">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="mb-6">
                  <h3 id="product-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                    {editingProduct ? 'Edit Product' : 'Add Product'}
                  </h3>
                  <p className="text-sm text-gray-600">Fill in the product details below</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.name ? 'input-field-error' : ''}`}
                      aria-invalid={formErrors.name ? 'true' : 'false'}
                      aria-describedby={formErrors.name ? 'name-error' : undefined}
                    />
                    {formErrors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        if (formErrors.price) setFormErrors({ ...formErrors, price: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.price ? 'input-field-error' : ''}`}
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.category_id}
                      onChange={(e) => {
                        setFormData({ ...formData, category_id: e.target.value })
                        if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.category_id ? 'input-field-error' : ''}`}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) => {
                        setFormData({ ...formData, stock: e.target.value === '' ? '' : parseInt(e.target.value, 10) })
                        if (formErrors.stock) setFormErrors({ ...formErrors, stock: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.stock ? 'input-field-error' : ''}`}
                    />
                    {formErrors.stock && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>
                    )}
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Product Image <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        required={!editingProduct}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.files[0] })
                        }}
                        className="input-field mt-2"
                      />

                      {formData.image instanceof File && (
                        <div className="mt-3">
                          <img
                            src={URL.createObjectURL(formData.image)}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}

                      {/* Existing image preview (edit mode) */}
                      {!formData.image && formData.imageUrl && (
                        <div className="mt-3">
                          <img
                            src={formData.imageUrl}
                            alt="Existing product"
                            className="h-32 w-32 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                
                    {formErrors.image && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.image}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      className="input-field mt-2"
                      placeholder="Product brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pack Size
                    </label>
                    <input
                      type="text"
                      value={formData.pack_size}
                      onChange={(e) =>
                        setFormData({ ...formData, pack_size: e.target.value })
                      }
                      className="input-field mt-2"
                      placeholder="e.g., 500g, 1kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="input-field mt-2"
                      rows="3"
                      placeholder="Product description"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_vegan}
                        onChange={(e) =>
                          setFormData({ ...formData, is_vegan: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Vegan</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_gluten_free}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_gluten_free: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gluten Free</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex items-center"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingProduct ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
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
