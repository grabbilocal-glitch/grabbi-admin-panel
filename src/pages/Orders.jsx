import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { SkeletonList } from '../components/UI/Skeleton'
import { MagnifyingGlassIcon, FunnelIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import OrderDetails from '../components/Orders/OrderDetails'

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
  { value: 'ready', label: 'Ready', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
]

export default function Orders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [franchiseFilter, setFranchiseFilter] = useState('all')
  const [franchises, setFranchises] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const fetchFranchises = useCallback(async () => {
    try {
      const response = await api.get('/admin/franchises')
      setFranchises(response.data || [])
    } catch {
      console.warn('Failed to fetch franchises for filter dropdown')
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders')
      setOrders(response.data || [])
    } catch (error) {
      toast.error(error.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
    fetchFranchises()
  }, [fetchOrders, fetchFranchises])

  const filterOrders = useCallback(() => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(term) ||
          order.user?.name?.toLowerCase().includes(term) ||
          order.user?.email?.toLowerCase().includes(term) ||
          order.delivery_address?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Franchise filter
    if (franchiseFilter !== 'all') {
      filtered = filtered.filter(
        (order) => String(order.franchise?.id || order.franchise_id) === String(franchiseFilter)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, franchiseFilter])

  useEffect(() => {
    filterOrders()
  }, [filterOrders])

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId)
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus })
      await fetchOrders()
      toast.success('Order status updated successfully')
    } catch (error) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const toggleOrderDetails = (orderId) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status)
    return statusOption || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by order number, customer name, email, or address..."
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
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Franchise
                </label>
                <select
                  value={franchiseFilter}
                  onChange={(e) => setFranchiseFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Franchises</option>
                  {franchises.map((franchise) => (
                    <option key={franchise.id} value={franchise.id}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
              </div>
              {(statusFilter !== 'all' || franchiseFilter !== 'all' || searchTerm) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setFranchiseFilter('all')
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

      {filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {orders.length === 0
              ? 'Orders will appear here once customers place them'
              : 'Try adjusting your search or filter criteria'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status)
              const isExpanded = expandedOrders.has(order.id)

              return (
                <li key={order.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-base font-semibold text-gray-900">
                            Order #{order.order_number}
                          </p>
                          <span className={`badge ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items?.length || 0} items • {order.user?.name || 'Customer'} • {order.delivery_address}
                          </p>
                          {order.franchise && (
                            <p className="text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                {order.franchise.name || 'Unknown Franchise'}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-xl font-bold text-gray-900 mb-3">
                          £{order.total?.toFixed(2) || '0.00'}
                        </p>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updatingOrderId === order.id}
                          className={`input-field text-sm py-2 ${updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <OrderDetails
                      order={order}
                      isExpanded={isExpanded}
                      onToggle={() => toggleOrderDetails(order.id)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
