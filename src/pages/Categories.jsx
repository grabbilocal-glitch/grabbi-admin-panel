import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { PencilIcon, TrashIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, categoryId: null })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/categories')
      setCategories(response.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
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
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, formData)
      } else {
        await api.post('/admin/categories', formData)
      }

      setShowModal(false)
      resetForm()
      setFormErrors({})
      fetchCategories()
      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description,
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.categoryId) return

    try {
      await api.delete(`/admin/categories/${deleteConfirm.categoryId}`)
      fetchCategories()
      toast.success('Category deleted successfully')
      setDeleteConfirm({ isOpen: false, categoryId: null })
    } catch (error) {
      toast.error(error.message || 'Failed to delete category')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', icon: '', description: '' })
    setEditingCategory(null)
    setFormErrors({})
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        </div>
        <SkeletonList count={5} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-12 text-center">
          <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No categories found</p>
          <p className="text-gray-400 text-sm mt-2">Get started by adding your first category</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {categories.map((category) => (
              <li key={category.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {category.icon ? (
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl border-2 border-indigo-200 shadow-sm">
                          {category.icon}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
                          <TagIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, categoryId: category.id })}
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
        <div className="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowModal(false)}
              aria-hidden="true"
            ></div>

            <div className="modal-content relative">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="mb-6">
                  <h3 id="category-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <p className="text-sm text-gray-600">Fill in the category details below</p>
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
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Icon (Emoji)
                    </label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) =>
                          setFormData({ ...formData, icon: e.target.value })
                        }
                        className="input-field flex-1"
                        placeholder="e.g., 📦, 🍎, 🥛"
                        maxLength={2}
                      />
                      {formData.icon && (
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl border-2 border-gray-300">
                            {formData.icon}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter an emoji or icon character (1-2 characters)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="input-field mt-2"
                      rows="3"
                      placeholder="Category description"
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
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
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingCategory ? 'Update' : 'Create'
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
        onClose={() => setDeleteConfirm({ isOpen: false, categoryId: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
