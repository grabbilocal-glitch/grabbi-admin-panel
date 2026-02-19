import { useState, useEffect, useRef } from 'react'
import { api } from '../../utils/api'
import LoadingSpinner from '../UI/LoadingSpinner'
import { useToast } from '../../contexts/ToastContext'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function ImagePreview({ image, index, isPrimary, onSetPrimary, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [image])

  if (!previewUrl) return null

  return (
    <div className="relative cursor-pointer group" onClick={() => onSetPrimary(index)}>
      <img
        src={previewUrl}
        alt={`Preview ${index + 1}`}
        className={`h-24 w-24 object-cover rounded-lg border ${isPrimary ? 'ring-4 ring-blue-500' : ''}`}
      />
      {isPrimary && (
        <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">Primary</span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(index)
        }}
        className="absolute top-1 left-25 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  categories,
  subcategories,
  onSubmit,
  submitting
}) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [mainCategoryId, setMainCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [imagesToDelete, setImagesToDelete] = useState([])
  const [primaryImageId, setPrimaryImageId] = useState(null)
  const [primaryNewImageIndex, setPrimaryNewImageIndex] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  const initialFormData = {
    sku: '',
    barcode: '',
    batch_number: '',
    item_name: '',
    short_description: '',
    long_description: '',
    cost_price: '',
    retail_price: '',
    promotion_price: '',
    promotion_start: '',
    promotion_end: '',
    gross_margin: 0,
    staff_discount: 0,
    tax_rate: 0,
    stock_quantity: '',
    reorder_level: '',
    shelf_location: '',
    weight_volume: 0,
    unit_of_measure: '',
    expiry_date: '',
    supplier: '',
    country_of_origin: '',
    is_gluten_free: false,
    is_vegetarian: false,
    is_age_restricted: false,
    minimum_age: '',
    allergen_info: '',
    storage_type: '',
    is_own_brand: false,
    online_visible: true,
    status: 'active',
    notes: '',
    name: '',
    price: '',
    stock: '',
    description: '',
    is_vegan: false,
    images: [],
    category_id: '',
    pack_size: '',
    brand: '',
  }

  const [formData, setFormData] = useState(initialFormData)
  const [franchises, setFranchises] = useState([])
  const [selectedFranchises, setSelectedFranchises] = useState([])
  const prevEditingProductIdRef = useRef(null)
  const prevIsOpenRef = useRef(false)

  // Fetch franchises list
  useEffect(() => {
    if (isOpen) {
      api.get('/admin/franchises').then(res => {
        setFranchises(res.data || [])
      }).catch(() => {})
    }
  }, [isOpen])

  // Load existing franchise associations when editing
  useEffect(() => {
    if (isOpen && editingProduct?.id) {
      api.get(`/admin/products/${editingProduct.id}/franchises`).then(res => {
        setSelectedFranchises(res.data?.franchise_ids || [])
      }).catch(() => setSelectedFranchises([]))
    } else if (isOpen && !editingProduct) {
      setSelectedFranchises([])
    }
  }, [isOpen, editingProduct?.id])

  // Main categories are all categories
  const mainCategories = categories

  // Subcategories filtered by selected main category
  const availableSubcategories = mainCategoryId
    ? subcategories.filter(sub => sub.category_id === mainCategoryId)
    : []

  // Update form when editingProduct.id changes or modal reopens
  useEffect(() => {
    if (editingProduct && (editingProduct.id !== prevEditingProductIdRef.current || (isOpen && !prevIsOpenRef.current))) {
      prevEditingProductIdRef.current = editingProduct.id
      prevIsOpenRef.current = isOpen

      const primaryImg = editingProduct.images?.find(img => img.is_primary)
      setPrimaryImageId(primaryImg?.id || null)
      setPrimaryNewImageIndex(null)

      const categoryId = editingProduct.category_id
      const subcategoryIdFromApi = editingProduct.subcategory_id

      if (subcategoryIdFromApi) {
        const subcategory = subcategories.find(sub => sub.id === subcategoryIdFromApi)
        if (subcategory) {
          setMainCategoryId(subcategory.category_id)
          setSubcategoryId(subcategoryIdFromApi)
          setFormData({
            ...initialFormData,
            sku: editingProduct.sku || '',
            barcode: editingProduct.barcode || '',
            batch_number: editingProduct.batch_number || '',
            item_name: editingProduct.item_name || editingProduct.name || '',
            short_description: editingProduct.short_description || editingProduct.description || '',
            long_description: editingProduct.long_description || '',
            cost_price: editingProduct.cost_price || '',
            retail_price: editingProduct.retail_price || editingProduct.price || '',
            promotion_price: editingProduct.promotion_price || '',
            promotion_start: editingProduct.promotion_start ? editingProduct.promotion_start.split('T')[0] : '',
            promotion_end: editingProduct.promotion_end ? editingProduct.promotion_end.split('T')[0] : '',
            gross_margin: editingProduct.gross_margin || 0,
            staff_discount: editingProduct.staff_discount || 0,
            tax_rate: editingProduct.tax_rate || 0,
            stock_quantity: editingProduct.stock_quantity !== undefined ? editingProduct.stock_quantity : (editingProduct.stock || 0),
            reorder_level: editingProduct.reorder_level || 0,
            shelf_location: editingProduct.shelf_location || '',
            weight_volume: editingProduct.weight_volume || 0,
            unit_of_measure: editingProduct.unit_of_measure || '',
            expiry_date: editingProduct.expiry_date ? editingProduct.expiry_date.split('T')[0] : '',
            supplier: editingProduct.supplier || '',
            country_of_origin: editingProduct.country_of_origin || '',
            is_gluten_free: editingProduct.is_gluten_free || false,
            is_vegetarian: editingProduct.is_vegetarian || editingProduct.is_vegan || false,
            is_age_restricted: editingProduct.is_age_restricted || false,
            minimum_age: editingProduct.minimum_age || '',
            allergen_info: editingProduct.allergen_info || '',
            storage_type: editingProduct.storage_type || '',
            is_own_brand: editingProduct.is_own_brand || false,
            online_visible: editingProduct.online_visible !== undefined ? editingProduct.online_visible : true,
            status: editingProduct.status || 'active',
            notes: editingProduct.notes || '',
            name: editingProduct.name || '',
            price: editingProduct.price || '',
            stock: editingProduct.stock || '',
            description: editingProduct.description || '',
            is_vegan: editingProduct.is_vegan || editingProduct.is_vegetarian || false,
            images: [],
            existingImages: editingProduct.images || [],
            category_id: categoryId || '',
            pack_size: editingProduct.pack_size || '',
            brand: editingProduct.brand || '',
          })
        }
      } else {
        let isSubcategory = false
        let parentCategoryId = null

        const subcategory = subcategories.find(sub => sub.id === categoryId)
        if (subcategory && subcategory.category_id) {
          isSubcategory = true
          parentCategoryId = subcategory.category_id
        } else if (editingProduct.category?.category_id) {
          isSubcategory = true
          parentCategoryId = editingProduct.category.category_id
        } else if (categories.find(cat => cat.id === categoryId)) {
          isSubcategory = false
          parentCategoryId = categoryId
        } else if (categoryId) {
          isSubcategory = false
          parentCategoryId = categoryId
        } else {
          parentCategoryId = ''
        }

        setMainCategoryId(parentCategoryId)
        setSubcategoryId(isSubcategory ? categoryId : '')

        setFormData({
          ...initialFormData,
          sku: editingProduct.sku || '',
          barcode: editingProduct.barcode || '',
          batch_number: editingProduct.batch_number || '',
          item_name: editingProduct.item_name || editingProduct.name || '',
          short_description: editingProduct.short_description || editingProduct.description || '',
          long_description: editingProduct.long_description || '',
          cost_price: editingProduct.cost_price || '',
          retail_price: editingProduct.retail_price || editingProduct.price || '',
          promotion_price: editingProduct.promotion_price || '',
          promotion_start: editingProduct.promotion_start ? editingProduct.promotion_start.split('T')[0] : '',
          promotion_end: editingProduct.promotion_end ? editingProduct.promotion_end.split('T')[0] : '',
          gross_margin: editingProduct.gross_margin || 0,
          staff_discount: editingProduct.staff_discount || 0,
          tax_rate: editingProduct.tax_rate || 0,
          stock_quantity: editingProduct.stock_quantity !== undefined ? editingProduct.stock_quantity : (editingProduct.stock || 0),
          reorder_level: editingProduct.reorder_level || 0,
          shelf_location: editingProduct.shelf_location || '',
          weight_volume: editingProduct.weight_volume || 0,
          unit_of_measure: editingProduct.unit_of_measure || '',
          expiry_date: editingProduct.expiry_date ? editingProduct.expiry_date.split('T')[0] : '',
          supplier: editingProduct.supplier || '',
          country_of_origin: editingProduct.country_of_origin || '',
          is_gluten_free: editingProduct.is_gluten_free || false,
          is_vegetarian: editingProduct.is_vegetarian || editingProduct.is_vegan || false,
          is_age_restricted: editingProduct.is_age_restricted || false,
          minimum_age: editingProduct.minimum_age || '',
          allergen_info: editingProduct.allergen_info || '',
          storage_type: editingProduct.storage_type || '',
          is_own_brand: editingProduct.is_own_brand || false,
          online_visible: editingProduct.online_visible !== undefined ? editingProduct.online_visible : true,
          status: editingProduct.status || 'active',
          notes: editingProduct.notes || '',
          name: editingProduct.name || '',
          price: editingProduct.price || '',
          stock: editingProduct.stock || '',
          description: editingProduct.description || '',
          is_vegan: editingProduct.is_vegan || editingProduct.is_vegetarian || false,
          images: [],
          existingImages: editingProduct.images || [],
          category_id: categoryId || '',
          pack_size: editingProduct.pack_size || '',
          brand: editingProduct.brand || '',
        })
      }
    }
  }, [editingProduct?.id, isOpen, categories, subcategories])

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false
    }
  }, [isOpen])

  const validateForm = () => {
    const errors = {}
    if (!formData.item_name.trim()) errors.item_name = 'Item name is required'
    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      errors.cost_price = 'Valid cost price is required'
    }
    if (!formData.retail_price || parseFloat(formData.retail_price) <= 0) {
      errors.retail_price = 'Valid retail price is required'
    }
    if (formData.stock_quantity === '' || formData.stock_quantity === null || formData.stock_quantity === undefined) {
      errors.stock_quantity = 'Stock quantity is required'
    } else if (parseInt(formData.stock_quantity) < 0) {
      errors.stock_quantity = 'Stock quantity cannot be negative'
    }

    if (formData.reorder_level === '' || formData.reorder_level === null || formData.reorder_level === undefined) {
      errors.reorder_level = 'Reorder level is required'
    } else if (parseInt(formData.reorder_level) < 0) {
      errors.reorder_level = 'Reorder level cannot be negative'
    }
    if (formData.weight_volume !== '' && (isNaN(formData.weight_volume) || parseFloat(formData.weight_volume) < 0)) {
      errors.weight_volume = 'Weight/volume must be a valid number'
    }

    if (!subcategoryId && !mainCategoryId) {
      errors.category_id = 'Category is required'
    }

    if (formData.images.length === 0 && !editingProduct) {
      errors.images = 'At least one product image is required'
    } else if (editingProduct && formData.images.length === 0 && (!formData.existingImages || formData.existingImages.length === 0)) {
      errors.images = 'Product must have at least one image'
    }
    if (formData.promotion_price && (!formData.promotion_start || !formData.promotion_end)) {
      errors.promotion = 'Promotion dates are required when promotion price is set'
    }
    if (formData.promotion_start && formData.promotion_end && new Date(formData.promotion_end) <= new Date(formData.promotion_start)) {
      errors.promotion = 'Promotion end date must be after start date'
    }
    if (formData.is_age_restricted && !formData.minimum_age) {
      errors.minimum_age = 'Minimum age is required for age-restricted items'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return { success: false }
    }

    const data = new FormData()
    data.append('sku', formData.sku)
    data.append('barcode', formData.barcode)
    data.append('batch_number', formData.batch_number)
    data.append('item_name', formData.item_name)
    data.append('short_description', formData.short_description)
    data.append('long_description', formData.long_description)
    data.append('cost_price', formData.cost_price)
    data.append('retail_price', formData.retail_price)
    if (formData.promotion_price) data.append('promotion_price', formData.promotion_price)
    if (formData.promotion_start) data.append('promotion_start', formData.promotion_start)
    if (formData.promotion_end) data.append('promotion_end', formData.promotion_end)
    data.append('gross_margin', formData.gross_margin || 0)
    data.append('staff_discount', formData.staff_discount || 0)
    data.append('tax_rate', formData.tax_rate || 0)
    data.append('stock_quantity', formData.stock_quantity)
    data.append('reorder_level', formData.reorder_level)
    data.append('shelf_location', formData.shelf_location)
    data.append('weight_volume', formData.weight_volume || 0)
    if (formData.unit_of_measure) data.append('unit_of_measure', formData.unit_of_measure)
    if (formData.expiry_date) data.append('expiry_date', formData.expiry_date)
    data.append('supplier', formData.supplier)
    data.append('country_of_origin', formData.country_of_origin)
    data.append('is_gluten_free', formData.is_gluten_free)
    data.append('is_vegetarian', formData.is_vegetarian)
    data.append('is_vegan', formData.is_vegan)
    data.append('is_age_restricted', formData.is_age_restricted)
    if (formData.minimum_age) data.append('minimum_age', formData.minimum_age)
    data.append('allergen_info', formData.allergen_info)
    data.append('storage_type', formData.storage_type)
    data.append('is_own_brand', formData.is_own_brand)
    data.append('online_visible', formData.online_visible)
    data.append('status', formData.status)
    data.append('notes', formData.notes)

    // Always send the main/parent category ID
    data.append('category_id', mainCategoryId)

    // Only send subcategory_id if a subcategory is selected
    if (subcategoryId) {
      data.append('subcategory_id', subcategoryId)
    }

    data.append('pack_size', formData.pack_size)
    data.append('brand', formData.brand)

    // Franchise associations
    if (selectedFranchises.length > 0) {
      data.append('franchise_ids', selectedFranchises.join(','))
    }

    let imagesToUpload = [...formData.images]
    if (primaryNewImageIndex !== null && primaryNewImageIndex > 0) {
      const primaryImage = imagesToUpload[primaryNewImageIndex]
      imagesToUpload = imagesToUpload.filter((_, i) => i !== primaryNewImageIndex)
      imagesToUpload.unshift(primaryImage)
    }

    imagesToUpload.forEach((image) => {
      data.append('images', image)
    })

    imagesToDelete.forEach((imageId) => {
      data.append('delete_images', imageId)
    })

    if (primaryImageId) {
      data.append('primary_image_id', primaryImageId)
    }

    return { success: true, data, imagesToDelete, primaryImageId }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setMainCategoryId('')
    setSubcategoryId('')
    setFormErrors({})
    setImagesToDelete([])
    setPrimaryImageId(null)
    setPrimaryNewImageIndex(null)
    setSelectedFranchises([])
    setFileInputKey(Date.now())
    setActiveTab('general')
  }

  if (!isOpen) return null

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        <div className="modal-content relative max-w-4xl w-full my-8">
          <form
            onSubmit={(e) => {
              const result = handleSubmit(e)
              if (result.success) {
                onSubmit(result)
              }
            }}
            className="p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-6">
              <h3 id="product-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <p className="text-sm text-gray-600">Fill in product details below</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {['general', 'pricing', 'inventory', 'details'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors capitalize`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barcode</label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="input-field mt-1"
                        placeholder="Product barcode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        className="input-field mt-1"
                        placeholder="Batch number"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.item_name}
                        onChange={(e) => {
                          setFormData({ ...formData, item_name: e.target.value })
                          if (formErrors.item_name) setFormErrors({ ...formErrors, item_name: '' })
                        }}
                        className={`input-field ${formErrors.item_name ? 'input-field-error' : ''}`}
                      />
                      {formErrors.item_name && <p className="mt-1 text-sm text-red-600">{formErrors.item_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Short Description</label>
                      <textarea
                        value={formData.short_description}
                        onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                        className="input-field"
                        rows="2"
                        placeholder="Brief product description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Long Description</label>
                      <textarea
                        value={formData.long_description}
                        onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                        className="input-field"
                        rows="3"
                        placeholder="Detailed product description"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <div>
                        <select
                          value={mainCategoryId}
                          onChange={(e) => {
                            const newMainCategoryId = e.target.value
                            setMainCategoryId(newMainCategoryId)

                            if (subcategoryId) {
                              const subcategory = subcategories.find(sub => sub.id === subcategoryId)
                              if (subcategory && subcategory.category_id !== newMainCategoryId) {
                                setSubcategoryId('')
                              }
                            }
                          }}
                          className="input-field"
                        >
                          <option value="">Select Main Category</option>
                          {mainCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Select a main category to see its subcategories
                        </p>
                      </div>
                      <div>
                        <select
                          value={subcategoryId}
                          onChange={(e) => {
                            setSubcategoryId(e.target.value)
                            if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: '' })
                          }}
                          disabled={!mainCategoryId}
                          className={`input-field ${!mainCategoryId ? 'bg-gray-100' : ''} ${formErrors.category_id ? 'input-field-error' : ''}`}
                        >
                          <option value="">Select Subcategory</option>
                          {availableSubcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                        {formErrors.category_id && <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>}
                        <p className="mt-1 text-xs text-gray-500">
                          {!mainCategoryId ? 'Select a main category first' : 'Optional - can leave blank to use main category'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Franchise Associations */}
                  {franchises.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to Franchises
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {franchises.map((franchise) => (
                          <label key={franchise.id} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedFranchises.includes(franchise.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFranchises([...selectedFranchises, franchise.id])
                                } else {
                                  setSelectedFranchises(selectedFranchises.filter(id => id !== franchise.id))
                                }
                              }}
                              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">{franchise.name}</span>
                            {franchise.city && <span className="text-gray-400 ml-1">({franchise.city})</span>}
                          </label>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedFranchises.length} franchise{selectedFranchises.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Images <span className="text-red-500">*</span>
                    </label>
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      multiple
                      required={!editingProduct && formData.images.length === 0}
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        const validFiles = []
                        for (const file of files) {
                          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                            toast.error(`"${file.name}" is not a supported image type. Use JPEG, PNG, WebP, or GIF.`)
                            continue
                          }
                          if (file.size > MAX_IMAGE_SIZE) {
                            toast.error(`"${file.name}" exceeds the 5MB size limit.`)
                            continue
                          }
                          validFiles.push(file)
                        }
                        if (validFiles.length === 0) {
                          setFileInputKey(Date.now())
                          return
                        }
                        if (formData.images.length === 0 && primaryNewImageIndex === null && (!formData.existingImages || formData.existingImages.length === 0)) {
                          setPrimaryNewImageIndex(0)
                        }
                        setFormData({ ...formData, images: [...formData.images, ...validFiles] })
                        setFileInputKey(Date.now())
                        if (formErrors.images && validFiles.length > 0) {
                          setFormErrors({ ...formErrors, images: '' })
                        }
                      }}
                      className="input-field mt-1"
                    />
                    {editingProduct && (!formData.existingImages || formData.existingImages.length === 0) && formData.images.length === 0 ? (
                      <p className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        No images found. Please add at least one product image.
                      </p>
                    ) : ((editingProduct && formData.existingImages && formData.existingImages.length > 0) || formData.images.length > 0) ? (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {editingProduct && formData.existingImages && formData.existingImages.map((image) => (
                          <div key={image.id} className="relative cursor-pointer group" onClick={() => {
                            setPrimaryImageId(image.id)
                            setPrimaryNewImageIndex(null)
                          }}>
                            <img
                              src={image.image_url}
                              alt={image.id}
                              className={`h-24 w-24 object-cover rounded-lg border ${primaryImageId === image.id ? 'ring-4 ring-blue-500' : ''}`}
                            />
                            {primaryImageId === image.id && (
                              <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">Primary</span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newExistingImages = formData.existingImages.filter(img => img.id !== image.id)
                                setFormData({ ...formData, existingImages: newExistingImages })
                                setImagesToDelete([...imagesToDelete, image.id])
                                if (primaryImageId === image.id) {
                                  if (newExistingImages.length > 0) {
                                    setPrimaryImageId(newExistingImages[0].id)
                                  } else {
                                    setPrimaryImageId(null)
                                  }
                                }
                              }}
                              className="absolute top-1 left-25 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg z-10"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {formData.images.map((image, index) => (
                          <ImagePreview
                            key={`new-${index}`}
                            image={image}
                            index={index}
                            isPrimary={primaryNewImageIndex === index}
                            onSetPrimary={(i) => {
                              setPrimaryNewImageIndex(i)
                              setPrimaryImageId(null)
                            }}
                            onRemove={(i) => {
                              const newImages = formData.images.filter((_, idx) => idx !== i)
                              setFormData({ ...formData, images: newImages })
                              if (primaryNewImageIndex === i) {
                                if (newImages.length > 0) {
                                  setPrimaryNewImageIndex(0)
                                } else {
                                  setPrimaryNewImageIndex(null)
                                }
                              } else if (primaryNewImageIndex > i) {
                                setPrimaryNewImageIndex(primaryNewImageIndex - 1)
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                    {formErrors.images && <p className="mt-1 text-sm text-red-600">{formErrors.images}</p>}
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cost Price (£) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.cost_price}
                        onChange={(e) => {
                          setFormData({ ...formData, cost_price: e.target.value })
                          if (formErrors.cost_price) setFormErrors({ ...formErrors, cost_price: '' })
                        }}
                        className={`input-field mt-1 ${formErrors.cost_price ? 'input-field-error' : ''}`}
                      />
                      {formErrors.cost_price && <p className="mt-1 text-sm text-red-600">{formErrors.cost_price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Retail Price (£) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.retail_price}
                        onChange={(e) => {
                          setFormData({ ...formData, retail_price: e.target.value })
                          if (formErrors.retail_price) setFormErrors({ ...formErrors, retail_price: '' })
                        }}
                        className={`input-field mt-1 ${formErrors.retail_price ? 'input-field-error' : ''}`}
                      />
                      {formErrors.retail_price && <p className="mt-1 text-sm text-red-600">{formErrors.retail_price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Promotion Price (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.promotion_price}
                        onChange={(e) => setFormData({ ...formData, promotion_price: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gross Margin (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.gross_margin}
                        onChange={(e) => setFormData({ ...formData, gross_margin: e.target.value })}
                        className="input-field mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Promotion Period
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <input
                        type="date"
                        value={formData.promotion_start}
                        onChange={(e) => {
                          setFormData({ ...formData, promotion_start: e.target.value })
                          if (formErrors.promotion) setFormErrors({ ...formErrors, promotion: '' })
                        }}
                        className="input-field"
                      />
                      <input
                        type="date"
                        value={formData.promotion_end}
                        onChange={(e) => {
                          setFormData({ ...formData, promotion_end: e.target.value })
                          if (formErrors.promotion) setFormErrors({ ...formErrors, promotion: '' })
                        }}
                        className="input-field"
                      />
                    </div>
                    {formErrors.promotion && <p className="mt-1 text-sm text-red-600">{formErrors.promotion}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Staff Discount (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.staff_discount}
                        onChange={(e) => setFormData({ ...formData, staff_discount: e.target.value })}
                        className="input-field mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        className="input-field mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.stock_quantity}
                        onChange={(e) => {
                          setFormData({ ...formData, stock_quantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) })
                          if (formErrors.stock_quantity) setFormErrors({ ...formErrors, stock_quantity: '' })
                        }}
                        className={`input-field mt-1 ${formErrors.stock_quantity ? 'input-field-error' : ''}`}
                      />
                      {formErrors.stock_quantity && <p className="mt-1 text-sm text-red-600">{formErrors.stock_quantity}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reorder Level <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.reorder_level}
                        onChange={(e) => {
                          setFormData({ ...formData, reorder_level: e.target.value === '' ? '' : parseInt(e.target.value, 10) })
                          if (formErrors.reorder_level) setFormErrors({ ...formErrors, reorder_level: '' })
                        }}
                        className={`input-field mt-1 ${formErrors.reorder_level ? 'input-field-error' : ''}`}
                        placeholder="0"
                      />
                      {formErrors.reorder_level && <p className="mt-1 text-sm text-red-600">{formErrors.reorder_level}</p>}
                      <p className="mt-1 text-xs text-gray-500">Numeric value only (e.g., 20)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Shelf Location
                      </label>
                      <input
                        type="text"
                        value={formData.shelf_location}
                        onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                        className="input-field mt-1"
                        placeholder="e.g., Aisle 3, Shelf B"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Weight/Volume
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.weight_volume}
                        onChange={(e) => setFormData({ ...formData, weight_volume: e.target.value })}
                        className={`input-field mt-1 ${formErrors.weight_volume ? 'input-field-error' : ''}`}
                        placeholder="0"
                      />
                      {formErrors.weight_volume && <p className="mt-1 text-sm text-red-600">{formErrors.weight_volume}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit of Measure
                      </label>
                      <select
                        value={formData.unit_of_measure}
                        onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                        className="input-field mt-1"
                      >
                        <option value="">Select unit</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="lb">lb</option>
                        <option value="oz">oz</option>
                        <option value="pcs">pcs</option>
                        <option value="unit">unit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="input-field mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="input-field"
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country of Origin</label>
                      <input
                        type="text"
                        value={formData.country_of_origin}
                        onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
                        className="input-field"
                        placeholder="Country name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="input-field"
                        placeholder="Product brand"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pack Size</label>
                      <input
                        type="text"
                        value={formData.pack_size}
                        onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 500g, 1kg"
                      />
                    </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Storage Type</label>
                          <input
                            type="text"
                            value={formData.storage_type}
                            onChange={(e) => setFormData({ ...formData, storage_type: e.target.value })}
                            className="input-field"
                            placeholder="e.g., Refrigerated, Frozen, Ambient"
                          />
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-field"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="gluten_free"
                        checked={formData.is_gluten_free}
                        onChange={(e) => setFormData({ ...formData, is_gluten_free: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="gluten_free" className="text-sm text-gray-700">Gluten Free</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="vegetarian"
                        checked={formData.is_vegetarian}
                        onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="vegetarian" className="text-sm text-gray-700">Vegetarian</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="vegan"
                        checked={formData.is_vegan}
                        onChange={(e) => setFormData({ ...formData, is_vegan: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="vegan" className="text-sm text-gray-700">Vegan</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="age_restricted"
                        checked={formData.is_age_restricted}
                        onChange={(e) => setFormData({ ...formData, is_age_restricted: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="age_restricted" className="text-sm text-gray-700">Age Restricted</label>
                    </div>
                  </div>
                  {formData.is_age_restricted && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Minimum Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minimum_age}
                        onChange={(e) => {
                          setFormData({ ...formData, minimum_age: e.target.value })
                          if (formErrors.minimum_age) setFormErrors({ ...formErrors, minimum_age: '' })
                        }}
                        className={`input-field ${formErrors.minimum_age ? 'input-field-error' : ''}`}
                        placeholder="18"
                      />
                      {formErrors.minimum_age && <p className="mt-1 text-sm text-red-600">{formErrors.minimum_age}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Allergen Information</label>
                    <textarea
                      value={formData.allergen_info}
                      onChange={(e) => setFormData({ ...formData, allergen_info: e.target.value })}
                      className="input-field mt-1"
                      rows="2"
                      placeholder="List any allergens"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input-field mt-1"
                      rows="2"
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="own_brand"
                        checked={formData.is_own_brand}
                        onChange={(e) => setFormData({ ...formData, is_own_brand: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="own_brand" className="text-sm text-gray-700">Own Brand</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="online_visible"
                        checked={formData.online_visible}
                        onChange={(e) => setFormData({ ...formData, online_visible: e.target.checked })}
                        className="mr-2"
                      />
                      <div>
                        <label htmlFor="online_visible" className="text-sm text-gray-700 font-medium">Visible Online</label>
                        <p className="text-xs text-gray-500 mt-0.5">Show/hide on customer-facing store (always visible in admin)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
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
  )
}