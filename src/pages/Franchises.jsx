import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { SkeletonList } from '../components/UI/Skeleton'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import MapLocationPicker from '../components/Map/MapLocationPicker'

const emptyForm = {
  name: '',
  slug: '',
  owner_email: '',
  owner_name: '',
  owner_password: '',
  address: '',
  city: '',
  post_code: '',
  latitude: '',
  longitude: '',
  delivery_radius: '',
  delivery_fee: '',
  free_delivery_min: '',
  phone: '',
  email: '',
}

export default function Franchises() {
  const toast = useToast()
  const [franchises, setFranchises] = useState([])
  const [filteredFranchises, setFilteredFranchises] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFranchise, setEditingFranchise] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, franchiseId: null })

  useEffect(() => {
    fetchFranchises()
  }, [])

  useEffect(() => {
    filterFranchises()
  }, [franchises, searchTerm])

  const fetchFranchises = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/franchises')
      setFranchises(response.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch franchises')
    } finally {
      setLoading(false)
    }
  }

  const filterFranchises = () => {
    let filtered = [...franchises]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (f) =>
          f.name?.toLowerCase().includes(term) ||
          f.city?.toLowerCase().includes(term) ||
          f.owner?.email?.toLowerCase().includes(term) ||
          f.owner_email?.toLowerCase().includes(term)
      )
    }
    setFilteredFranchises(filtered)
  }

  const handleOpenCreate = () => {
    setEditingFranchise(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const handleOpenEdit = (franchise) => {
    setEditingFranchise(franchise)
    setFormData({
      name: franchise.name || '',
      slug: franchise.slug || '',
      owner_email: franchise.owner?.email || franchise.owner_email || '',
      owner_name: franchise.owner?.name || franchise.owner_name || '',
      owner_password: '',
      address: franchise.address || '',
      city: franchise.city || '',
      post_code: franchise.post_code || '',
      latitude: franchise.latitude || '',
      longitude: franchise.longitude || '',
      delivery_radius: franchise.delivery_radius || '',
      delivery_fee: franchise.delivery_fee || '',
      free_delivery_min: franchise.free_delivery_min || '',
      phone: franchise.phone || '',
      email: franchise.email || '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFranchise(null)
    setFormData(emptyForm)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = { ...formData }

      // Convert numeric fields
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude)
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude)
      if (payload.delivery_radius) payload.delivery_radius = parseFloat(payload.delivery_radius)
      if (payload.delivery_fee) payload.delivery_fee = parseFloat(payload.delivery_fee)
      if (payload.free_delivery_min) payload.free_delivery_min = parseFloat(payload.free_delivery_min)

      // Remove empty password on edit
      if (editingFranchise && !payload.owner_password) {
        delete payload.owner_password
      }

      if (editingFranchise) {
        await api.put(`/admin/franchises/${editingFranchise.id}`, payload)
        toast.success('Franchise updated successfully')
      } else {
        await api.post('/admin/franchises', payload)
        toast.success('Franchise created successfully')
      }

      handleCloseModal()
      fetchFranchises()
    } catch (error) {
      toast.error(error.message || 'Failed to save franchise')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.franchiseId) return
    try {
      await api.delete(`/admin/franchises/${deleteConfirm.franchiseId}`)
      toast.success('Franchise deleted successfully')
      setDeleteConfirm({ isOpen: false, franchiseId: null })
      fetchFranchises()
    } catch (error) {
      toast.error(error.message || 'Failed to delete franchise')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Franchises</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Franchises</h1>
            <p className="text-gray-600">Manage franchise locations and owners</p>
          </div>
          <button onClick={handleOpenCreate} className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Franchise
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, city, or owner email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </div>
      </div>

      {filteredFranchises.length === 0 ? (
        <div className="card p-12 text-center">
          <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {franchises.length === 0 ? 'No franchises found' : 'No franchises match your search'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {franchises.length === 0
              ? 'Get started by adding your first franchise'
              : 'Try adjusting your search criteria'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Owner Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredFranchises.map((franchise) => (
                  <tr key={franchise.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/franchises/${franchise.id}`}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {franchise.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {franchise.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {franchise.owner?.email || franchise.owner_email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {franchise.order_count ?? franchise.orders_count ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          franchise.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {franchise.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(franchise.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(franchise)}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ isOpen: true, franchiseId: franchise.id })
                          }
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFranchise ? 'Edit Franchise' : 'Create Franchise'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingFranchise
                    ? 'Update the franchise details below'
                    : 'Fill in the details to create a new franchise'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Franchise Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Franchise Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g. Grabbi Manchester"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g. grabbi-manchester"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. 07123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. manchester@grabbi.co.uk"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Owner Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      required={!editingFranchise}
                      className="input-field"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="owner_email"
                      value={formData.owner_email}
                      onChange={handleChange}
                      required={!editingFranchise}
                      className="input-field"
                      placeholder="owner@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Password {!editingFranchise && <span className="text-red-500">*</span>}
                      {editingFranchise && (
                        <span className="text-gray-400 text-xs ml-1">(leave blank to keep current)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      name="owner_password"
                      value={formData.owner_password}
                      onChange={handleChange}
                      required={!editingFranchise}
                      className="input-field"
                      placeholder={editingFranchise ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g. Manchester"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="post_code"
                      value={formData.post_code}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="e.g. M1 1AA"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (click map or search)
                    </label>
                    <MapLocationPicker
                      value={{
                        lat: formData.latitude ? parseFloat(formData.latitude) : null,
                        lng: formData.longitude ? parseFloat(formData.longitude) : null,
                      }}
                      onChange={({ lat, lng, address }) => {
                        setFormData((prev) => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                          address: address || prev.address,
                        }))
                      }}
                      height="220px"
                    />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleChange}
                          className="input-field text-sm"
                          placeholder="e.g. 53.4808"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleChange}
                          className="input-field text-sm"
                          placeholder="e.g. -2.2426"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Delivery Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="delivery_radius"
                      value={formData.delivery_radius}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Fee (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="delivery_fee"
                      value={formData.delivery_fee}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. 2.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Delivery Min (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="free_delivery_min"
                      value={formData.free_delivery_min}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="e.g. 25.00"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingFranchise ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingFranchise ? (
                    'Update Franchise'
                  ) : (
                    'Create Franchise'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, franchiseId: null })}
        onConfirm={handleDelete}
        title="Delete Franchise"
        message="Are you sure you want to delete this franchise? This will remove all associated data and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
