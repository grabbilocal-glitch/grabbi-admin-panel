import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export default function OrderDetails({ order, isExpanded, onToggle }) {
  if (!order) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Order Details</span>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {order.user?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{order.user?.email || 'N/A'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500">Delivery Address:</span>
                <span className="ml-2 text-gray-900">{order.delivery_address || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Payment Method:</span>
                <span className="ml-2 text-gray-900 capitalize">
                  {order.payment_method || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Order Date:</span>
                <span className="ml-2 text-gray-900">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center flex-1">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product?.name || 'Product'}
                          className="h-12 w-12 object-cover rounded-md mr-3"
                        />
                      ) : item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].image_url}
                          alt={item.product.name}
                          className="h-12 w-12 object-cover rounded-md mr-3"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md mr-3 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.product?.name || 'Product'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Quantity: {item.quantity} × £{item.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        £{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No items found</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">£{order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="text-gray-900">
                  {order.delivery_fee > 0 ? `£${order.delivery_fee.toFixed(2)}` : 'Free'}
                </span>
              </div>
              {order.points_earned > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Loyalty Points Earned:</span>
                  <span className="text-gray-900">{order.points_earned}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-base font-semibold text-gray-900">
                  £{order.total?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
