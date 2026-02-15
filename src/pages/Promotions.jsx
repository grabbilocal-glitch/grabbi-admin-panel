import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../utils/api'
import { PencilIcon, TrashIcon, PlusIcon, MegaphoneIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'

function PromotionImagePreview({ image }) {
  const previewUrl = useMemo(() => {
    if (image instanceof File) {
      return URL.createObjectURL(image)
    }
    return null
  }, [image])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!previewUrl) return null

  return (
    <div className="mt-3">
      <img
        src={previewUrl}
        alt="Preview"
        className="h-48 w-full object-cover rounded-lg border"
      />
    </div>
  )
}

export default function Promotions() {
  const toast = useToast()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, promotionId: null })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    is_active: true,
    product_url: '',
    start_date: '',
    end_date: '',
  })

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/promotions')
      setPromotions(response.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch promotions')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!editingPromotion && !formData.image) {
    errors.image = 'Image is required'
  }
    if (formData.start_date && formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date'
    }
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

      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('is_active', formData.is_active)
      payload.append('product_url', formData.product_url)
      if (formData.start_date) payload.append('start_date', formData.start_date)
      if (formData.end_date) payload.append('end_date', formData.end_date)

      if (formData.image instanceof File) {
        payload.append('image', formData.image)
      }

      if (editingPromotion) {
        await api.put(`/admin/promotions/${editingPromotion.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/admin/promotions', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setShowModal(false)
      resetForm()
      setFormErrors({})
      fetchPromotions()
      toast.success(editingPromotion ? 'Promotion updated successfully' : 'Promotion created successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to save promotion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      title: promotion.title,
      description: promotion.description,
      image: null,
      is_active: promotion.is_active,
      product_url: promotion.product_url || '',
      start_date: promotion.start_date ? promotion.start_date.slice(0, 10) : '',
      end_date: promotion.end_date ? promotion.end_date.slice(0, 10) : '',
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.promotionId) return

    try {
      await api.delete(`/admin/promotions/${deleteConfirm.promotionId}`)
      fetchPromotions()
      toast.success('Promotion deleted successfully')
      setDeleteConfirm({ isOpen: false, promotionId: null })
    } catch (error) {
      toast.error(error.message || 'Failed to delete promotion')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', image: '', is_active: true, product_url: '', start_date: '', end_date: '' })
    setEditingPromotion(null)
    setFormErrors({})
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
        </div>
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Promotions</h1>
          <p className="text-gray-600">Manage special offers and discounts</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Promotion
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="card p-12 text-center">
          <MegaphoneIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No promotions found</p>
          <p className="text-gray-400 text-sm mt-2">Get started by adding your first promotion</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {promotions.map((promotion) => (
            <li key={promotion.id} className="hover:bg-gray-50 transition-colors">
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center flex-1">
                  {promotion.image ? (
                    <img
                      src={promotion.image}
                      alt={promotion.title}
                      className="h-20 w-20 object-cover rounded-xl mr-4 shadow-sm border border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl mr-4 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      <MegaphoneIcon className="h-8 w-8 text-orange-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {promotion.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {promotion.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`badge ${
                          promotion.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {promotion.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {(promotion.start_date || promotion.end_date) && (
                        <span className="text-xs text-gray-500">
                          {promotion.start_date ? new Date(promotion.start_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}{' '}
                          &mdash;{' '}
                          {promotion.end_date ? new Date(promotion.end_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) : '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(promotion)}
                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, promotionId: promotion.id })}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
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

      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
              aria-hidden="true"
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit} className="p-6">
                <h3 id="promotion-modal-title" className="text-lg font-medium mb-4">
                  {editingPromotion ? 'Edit Promotion' : 'Add Promotion'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value })
                        if (formErrors.title) setFormErrors({ ...formErrors, title: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.title ? 'input-field-error' : ''}`}
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                        if (formErrors.description) setFormErrors({ ...formErrors, description: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.description ? 'input-field-error' : ''}`}
                      rows="3"
                      placeholder="Promotion description"
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Image
                    </label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.files[0] })
                        if (formErrors.image) setFormErrors({ ...formErrors, image: '' })
                      }}
                      className={`input-field mt-2 ${formErrors.image ? 'input-field-error' : ''}`}
                    />

                    {formErrors.image && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.image}</p>
                    )}

                    {/* New uploaded image preview */}
                    <PromotionImagePreview image={formData.image} />

                    {/* Existing image preview (edit mode) */}
                    {!formData.image && editingPromotion?.image && (
                      <div className="mt-3">
                        <img
                          src={editingPromotion.image}
                          alt="Existing promotion"
                          className="h-48 w-full object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.product_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          product_url: e.target.value,
                        })
                      }
                      className="input-field mt-2"
                      placeholder="https://example.com/product"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter a URL where users will be directed when they click this promotion
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => {
                          setFormData({ ...formData, start_date: e.target.value })
                          if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: '' })
                        }}
                        className="input-field mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => {
                          setFormData({ ...formData, end_date: e.target.value })
                          if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: '' })
                        }}
                        className={`input-field mt-2 ${formErrors.end_date ? 'input-field-error' : ''}`}
                      />
                      {formErrors.end_date && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
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
                        {editingPromotion ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingPromotion ? 'Update' : 'Create'
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
        onClose={() => setDeleteConfirm({ isOpen: false, promotionId: null })}
        onConfirm={handleDelete}
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
