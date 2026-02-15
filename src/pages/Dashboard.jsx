import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { SkeletonCard } from '../components/UI/Skeleton'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { Link } from 'react-router-dom'
import {
  CubeIcon,
  ShoppingBagIcon,
  TagIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const toast = useToast()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
    totalFranchises: 0,
    totalRevenue: 0,
    recentRevenue: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [franchises, setFranchises] = useState([])
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)

      const franchiseParam = selectedFranchiseId ? `?franchise_id=${selectedFranchiseId}` : ''

      // Fetch dashboard stats and franchises list in parallel
      const [dashboardRes, franchisesRes] = await Promise.all([
        api.get(`/admin/dashboard${franchiseParam}`),
        api.get('/admin/franchises'),
      ])

      const data = dashboardRes.data
      const allFranchises = franchisesRes.data || []
      setFranchises(allFranchises)
      setRecentOrders(data.recent_orders || [])

      setStats({
        totalProducts: data.total_products || 0,
        totalOrders: data.total_orders || 0,
        totalCategories: data.total_categories || 0,
        totalFranchises: data.total_franchises || allFranchises.length,
        totalRevenue: data.total_revenue || 0,
        recentRevenue: data.recent_revenue || 0,
        pendingOrders: data.pending_orders || 0,
      })
    } catch (error) {
      toast.error(error.message || 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [selectedFranchiseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-4 w-4 text-gray-500" />
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="input-field text-sm py-2 pr-8"
            >
              <option value="">All Franchises</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStats}
            className="btn-secondary"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link
          to="/products"
          className="stat-card group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 gradient-primary rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <CubeIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  Total Products
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalProducts}
                </dd>
              </dl>
            </div>
          </div>
        </Link>

        <Link
          to="/orders"
          className="stat-card group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <ShoppingBagIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  Total Orders
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalOrders}
                </dd>
                {stats.pendingOrders > 0 && (
                  <dd className="text-xs font-semibold text-orange-600 mt-1.5 flex items-center">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 animate-pulse"></span>
                    {stats.pendingOrders} pending
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </Link>

        <Link
          to="/categories"
          className="stat-card group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <TagIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  Categories
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalCategories}
                </dd>
              </dl>
            </div>
          </div>
        </Link>

        <Link
          to="/franchises"
          className="stat-card group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
              <BuildingStorefrontIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  Franchises
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalFranchises}
                </dd>
              </dl>
            </div>
          </div>
        </Link>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0 gradient-success rounded-xl p-4 shadow-lg">
              <CurrencyDollarIcon className="h-7 w-7 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  Total Revenue
                </dt>
                <dd className="text-3xl font-bold text-gray-900 mt-1">
                  £{stats.totalRevenue.toFixed(2)}
                </dd>
                {stats.recentRevenue > 0 && (
                  <dd className="text-xs font-semibold text-green-600 mt-1.5 flex items-center">
                    <ArrowTrendingUpIcon className="h-3.5 w-3.5 mr-1" />
                    £{stats.recentRevenue.toFixed(2)} last 7 days
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-500 mt-1">Latest order activity</p>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBagIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent orders</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to="/orders"
                  className="block px-6 py-4 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-transparent transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        Order #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.user?.name || 'Customer'} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-gray-900">
                        £{order.total?.toFixed(2) || '0.00'}
                      </p>
                      <span
                        className={`badge mt-1.5 ${getStatusColor(order.status)}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          {recentOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
              <Link
                to="/orders"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center"
              >
                View all orders
                <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            <p className="text-sm text-gray-500 mt-1">Key performance metrics</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Average Order Value</span>
              <span className="text-sm font-bold text-gray-900">
                £
                {stats.totalOrders > 0
                  ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Pending Orders</span>
              <span className="text-sm font-bold text-orange-600">
                {stats.pendingOrders}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Revenue (Last 7 Days)</span>
              <span className="text-sm font-bold text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                £{stats.recentRevenue.toFixed(2)}
              </span>
            </div>
            {stats.totalOrders > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                  <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {stats.recentRevenue > 0
                      ? ((stats.recentRevenue / stats.totalRevenue) * 100).toFixed(1)
                      : 0}
                    % of total
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
