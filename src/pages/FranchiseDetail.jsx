import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { SkeletonCard } from '../components/UI/Skeleton'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import {
  ArrowLeftIcon,
  PencilIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  TruckIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import MapLocationPicker from '../components/Map/MapLocationPicker'

export default function FranchiseDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [franchise, setFranchise] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({})

  const fetchFranchise = useCallback(async () => {
    try {
      setLoading(true)
      // Try fetching single franchise first; fall back to fetching all and filtering
      let found = null
      try {
        const response = await api.get(`/admin/franchises/${id}`)
        found = response.data
      } catch {
        // Single franchise endpoint may not exist — fall back to list
        const response = await api.get(`/admin/franchises`)
        const allFranchises = response.data || []
        found = allFranchises.find((f) => String(f.id) === String(id))
      }
      if (found) {
        setFranchise(found)
        setFormData({
          name: found.name || '',
          slug: found.slug || '',
          address: found.address || '',
          city: found.city || '',
          post_code: found.post_code || '',
          latitude: found.latitude || '',
          longitude: found.longitude || '',
          delivery_radius: found.delivery_radius || '',
          delivery_fee: found.delivery_fee || '',
          free_delivery_min: found.free_delivery_min || '',
          phone: found.phone || '',
          email: found.email || '',
          is_active: found.is_active ?? true,
        })
      } else {
        toast.error('Franchise not found')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch franchise')
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  const fetchFranchiseOrders = useCallback(async () => {
    try {
      setOrdersLoading(true)
      const response = await api.get(`/admin/franchises/${id}/orders`)
      setOrders(response.data || [])
    } catch {
      toast.error('Failed to fetch franchise orders')
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [id, toast])

  const fetchFranchiseProducts = useCallback(async () => {
    try {
      setProductsLoading(true)
      const response = await api.get(`/franchises/${id}/products`)
      setProducts(response.data || [])
    } catch {
      toast.error('Failed to fetch franchise products')
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    fetchFranchise()
    fetchFranchiseOrders()
    fetchFranchiseProducts()
  }, [fetchFranchise, fetchFranchiseOrders, fetchFranchiseProducts])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSave = async () => {
    try {
      setSubmitting(true)
      const payload = { ...formData }

      if (payload.latitude) payload.latitude = parseFloat(payload.latitude)
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude)
      if (payload.delivery_radius) payload.delivery_radius = parseFloat(payload.delivery_radius)
      if (payload.delivery_fee) payload.delivery_fee = parseFloat(payload.delivery_fee)
      if (payload.free_delivery_min) payload.free_delivery_min = parseFloat(payload.free_delivery_min)

      await api.put(`/admin/franchises/${id}`, payload)
      toast.success('Franchise updated successfully')
      setEditing(false)
      fetchFranchise()
    } catch (error) {
      toast.error(error.message || 'Failed to update franchise')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    if (franchise) {
      setFormData({
        name: franchise.name || '',
        slug: franchise.slug || '',
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
        is_active: franchise.is_active ?? true,
      })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Franchise Details</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!franchise) {
    return (
      <div className="card p-12 text-center">
        <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">Franchise not found</p>
        <Link to="/franchises" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
          Back to Franchises
        </Link>
      </div>
    )
  }

  // Compute stats
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const staff = franchise.staff || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/franchises"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">{franchise.name}</h1>
            <p className="text-gray-600">
              {franchise.city || 'No city'} &middot;{' '}
              <span
                className={`badge ${
                  franchise.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {franchise.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
        <div>
          {editing ? (
            <div className="flex space-x-2">
              <button onClick={handleCancelEdit} className="btn-secondary" disabled={submitting}>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Franchise
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
              <ShoppingBagIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Total Orders</dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">{totalOrders}</dd>
                {pendingOrders > 0 && (
                  <dd className="text-xs font-semibold text-orange-600 mt-1.5 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 animate-pulse"></span>
                    {pendingOrders} pending
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0 gradient-success rounded-xl p-4 shadow-lg">
              <ChartBarIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Revenue</dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  £{totalRevenue.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-lg">
              <UserGroupIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Staff</dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">{staff.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 shadow-lg">
              <TruckIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">Delivery Radius</dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {franchise.delivery_radius ? `${franchise.delivery_radius} km` : '-'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Franchise Info */}
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">Franchise Information</h2>
            <p className="text-sm text-gray-500 mt-1">Location and contact details</p>
          </div>
          <div className="p-6 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Post Code</label>
                    <input
                      type="text"
                      name="post_code"
                      value={formData.post_code}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field"
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
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start p-3 rounded-lg bg-gray-50">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {franchise.address || '-'}
                      {franchise.city && `, ${franchise.city}`}
                      {franchise.post_code && ` ${franchise.post_code}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-3 rounded-lg bg-gray-50">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Owner</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {franchise.owner?.name || '-'} ({franchise.owner?.email || franchise.owner_email || '-'})
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-3 rounded-lg bg-gray-50">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {franchise.phone || '-'} &middot; {franchise.email || '-'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">Delivery Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Delivery configuration for this franchise</p>
          </div>
          <div className="p-6 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Delivery Minimum (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="free_delivery_min"
                    value={formData.free_delivery_min}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
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
                    height="200px"
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Delivery Radius</span>
                  <span className="text-sm font-bold text-gray-900">
                    {franchise.delivery_radius ? `${franchise.delivery_radius} km` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Delivery Fee</span>
                  <span className="text-sm font-bold text-gray-900">
                    {franchise.delivery_fee != null ? `£${parseFloat(franchise.delivery_fee).toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Free Delivery Minimum</span>
                  <span className="text-sm font-bold text-gray-900">
                    {franchise.free_delivery_min != null
                      ? `£${parseFloat(franchise.free_delivery_min).toFixed(2)}`
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Coordinates</span>
                  <span className="text-sm font-bold text-gray-900">
                    {franchise.latitude && franchise.longitude
                      ? `${franchise.latitude}, ${franchise.longitude}`
                      : '-'}
                  </span>
                </div>
                {franchise.latitude && franchise.longitude && (
                  <MapLocationPicker
                    value={{ lat: parseFloat(franchise.latitude), lng: parseFloat(franchise.longitude) }}
                    onChange={() => {}}
                    readOnly
                    height="180px"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Franchise Orders */}
      <div className="card mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Franchise Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Recent orders for this franchise</p>
        </div>
        {ordersLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet for this franchise</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.slice(0, 20).map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-transparent transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Order #{order.order_number}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.user?.name || 'Customer'} &middot; {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-gray-900">
                      £{order.total?.toFixed(2) || '0.00'}
                    </p>
                    <span className={`badge mt-1.5 ${getStatusColor(order.status)}`}>
                      {order.status?.replace('_', ' ') || 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {orders.length > 20 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  Showing 20 of {orders.length} orders
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="card mb-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-1">Products available at this franchise with stock and pricing overrides</p>
        </div>
        {productsLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products assigned to this franchise</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span className="col-span-5">Product</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Override</span>
              <span className="col-span-1 text-right">Stock</span>
              <span className="col-span-2 text-right">Status</span>
            </div>
            {products.slice(0, 30).map((product) => (
              <div
                key={product.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.item_name || product.name}</p>
                  <p className="text-xs text-gray-500 truncate">{product.brand || ''}</p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm text-gray-900">
                    £{(product.retail_price || product.price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  {product.override_price != null ? (
                    <span className="text-sm font-semibold text-indigo-600">
                      £{parseFloat(product.override_price).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  <span className={`text-sm font-medium ${(product.stock_quantity ?? product.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock_quantity ?? product.stock ?? 0}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`badge ${(product.stock_quantity ?? product.stock ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(product.stock_quantity ?? product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
            {products.length > 30 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-sm text-gray-500">
                  Showing 30 of {products.length} products
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="card">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
          <p className="text-sm text-gray-500 mt-1">People assigned to this franchise</p>
        </div>
        {staff.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No staff members assigned</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((member) => (
              <div key={member.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <span className="badge bg-indigo-100 text-indigo-800">
                    {member.role || 'Staff'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
