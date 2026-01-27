import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { PencilIcon, TrashIcon, PlusIcon, TagIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, categoryId: null })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    category_id: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories')
      ])
      setCategories(categoriesRes.data || [])
      setSubcategories(subcategoriesRes.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  // Get subcategories for a specific category
  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  // Build hierarchical tree for display
  const buildCategoryTree = () => {
    return categories.map(category => ({
      ...category,
      subcategories: getSubcategoriesForCategory(category.id)
    }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (isAddingSubCategory && !editingCategory && !selectedParentCategory) {
      errors.category_id = 'Parent category is required for subcategories'
    }
    // Only validate parent category if editing a subcategory
    if (editingCategory && editingCategory.category_id && selectedParentCategory && selectedParentCategory === editingCategory.id) {
      // This shouldn't happen since we're editing a subcategory, but keep as safety check
      errors.category_id = 'Invalid parent category selection'
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
      
      if (editingCategory) {
        // Check if editing a category or subcategory
        if (editingCategory.category_id) {
          // Editing subcategory
          const submitData = {
            name: formData.name,
            icon: formData.icon,
            description: formData.description,
            category_id: selectedParentCategory,
          }
          await api.put(`/admin/subcategories/${editingCategory.id}`, submitData)
          toast.success('Subcategory updated successfully')
        } else {
          // Editing main category
          const submitData = {
            name: formData.name,
            icon: formData.icon,
            description: formData.description,
          }
          await api.put(`/admin/categories/${editingCategory.id}`, submitData)
          toast.success('Category updated successfully')
        }
      } else {
        // Creating new
        if (isAddingSubCategory) {
          // Creating subcategory
          const submitData = {
            name: formData.name,
            icon: formData.icon,
            description: formData.description,
            category_id: selectedParentCategory,
          }
          await api.post('/admin/subcategories', submitData)
          toast.success('Subcategory created successfully')
        } else {
          // Creating main category
          const submitData = {
            name: formData.name,
            icon: formData.icon,
            description: formData.description,
          }
          await api.post('/admin/categories', submitData)
          toast.success('Category created successfully')
        }
      }

      setShowModal(false)
      resetForm()
      setFormErrors({})
      fetchCategories()
    } catch (error) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setEditingCategory(item)
    setIsAddingSubCategory(!!item.category_id)
    setSelectedParentCategory(item.category_id || '')
    setFormData({
      name: item.name,
      icon: item.icon,
      description: item.description,
      category_id: item.category_id || '',
    })
    setShowModal(true)
  }

  const handleAddCategory = () => {
    resetForm()
    setIsAddingSubCategory(false)
    setSelectedParentCategory('')
    setShowModal(true)
  }

  const handleAddSubCategory = () => {
    resetForm()
    setIsAddingSubCategory(true)
    setSelectedParentCategory('')
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.categoryId) return

    try {
      // Check if it's a category or subcategory
      const item = [...categories, ...subcategories].find(i => i.id === deleteConfirm.categoryId)
      if (item?.category_id) {
        await api.delete(`/admin/subcategories/${deleteConfirm.categoryId}`)
        toast.success('Subcategory deleted successfully')
      } else {
        await api.delete(`/admin/categories/${deleteConfirm.categoryId}`)
        toast.success('Category deleted successfully')
      }
      fetchCategories()
      setDeleteConfirm({ isOpen: false, categoryId: null })
    } catch (error) {
      toast.error(error.message || 'Failed to delete')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', icon: '', description: '', category_id: '' })
    setSelectedParentCategory('')
    setEditingCategory(null)
    setIsAddingSubCategory(false)
    setFormErrors({})
  }

  // Get available parent categories
  const getAvailableParentCategories = () => {
    if (!editingCategory) {
      return categories
    }
    // When editing, exclude the current category from parent options
    return categories.filter(cat => cat.id !== editingCategory.id)
  }

  const availableParents = getAvailableParentCategories()

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

  const categoryTree = buildCategoryTree()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAddCategory}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Category
          </button>
          <button
            onClick={handleAddSubCategory}
            className="btn-secondary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Sub Category
          </button>
        </div>
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
            {categoryTree.map((mainCategory) => (
              <li key={mainCategory.id} className="hover:bg-gray-50 transition-colors">
                {/* Main Category */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {mainCategory.icon ? (
                      <div className="flex-shrink-0 mr-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl border-2 border-indigo-200 shadow-sm">
                          {mainCategory.icon}
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
                        {mainCategory.name}
                      </p>
                      {mainCategory.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {mainCategory.description}
                        </p>
                      )}
                      {mainCategory.subcategories && mainCategory.subcategories.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {mainCategory.subcategories.length} subcategor{mainCategory.subcategories.length === 1 ? 'y' : 'ies'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(mainCategory)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, categoryId: mainCategory.id })}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {mainCategory.subcategories && mainCategory.subcategories.length > 0 && (
                  <ul className="divide-y divide-gray-50 bg-gray-50">
                    {mainCategory.subcategories.map((subcategory) => (
                      <li key={subcategory.id} className="hover:bg-gray-100 transition-colors">
                        <div className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="flex items-center">
                              <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                              {subcategory.icon ? (
                                <div className="flex-shrink-0 mr-4">
                                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl border border-indigo-100">
                                    {subcategory.icon}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-shrink-0 mr-4">
                                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <TagIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {subcategory.name}
                                </p>
                                {subcategory.description && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {subcategory.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(subcategory)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, categoryId: subcategory.id })}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
                    {editingCategory 
                      ? 'Edit Category' 
                      : (isAddingSubCategory ? 'Add Sub Category' : 'Add Category')
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingCategory 
                      ? 'Update the category details below' 
                      : (isAddingSubCategory ? 'Fill in the subcategory details below' : 'Fill in the category details below')
                    }
                  </p>
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

                  {(isAddingSubCategory || editingCategory) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Parent Category {isAddingSubCategory && !editingCategory && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={selectedParentCategory}
                        onChange={(e) => {
                          setSelectedParentCategory(e.target.value)
                          if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: '' })
                        }}
                        className={`input-field mt-2 ${formErrors.category_id ? 'input-field-error' : ''}`}
                        required={isAddingSubCategory && !editingCategory}
                      >
                        <option value="">None (Main Category)</option>
                        {availableParents.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category_id && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {isAddingSubCategory && !editingCategory 
                          ? 'Select a parent category for this subcategory'
                          : 'Select a parent category to create a subcategory'
                        }
                      </p>
                    </div>
                  )}

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
