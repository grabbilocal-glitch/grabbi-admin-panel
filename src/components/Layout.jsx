import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  TagIcon,
  MegaphoneIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function Layout({ onLogout }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingBagIcon },
    { name: 'Franchises', href: '/franchises', icon: BuildingStorefrontIcon },
    { name: 'Categories', href: '/categories', icon: TagIcon },
    { name: 'Promotions', href: '/promotions', icon: MegaphoneIcon },
    { name: 'Users', href: '/users', icon: UserGroupIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm px-4 py-3.5 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
            Grabbi Admin
          </h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 md:z-auto w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg md:shadow-none transform transition-transform duration-300 ease-in-out md:flex md:flex-col`}
        >
          <div className="flex flex-col flex-grow pt-16 md:pt-0">
            <div className="hidden md:flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                Grabbi Admin
              </h1>
            </div>
            <div className="flex-grow flex flex-col overflow-y-auto">
              <nav className="flex-1 px-3 py-6 space-y-1.5">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${
                        isActive
                          ? 'nav-link-active shadow-md'
                          : 'nav-link-inactive'
                      } nav-link`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon
                        className={`${
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-gray-600'
                        } mr-3 flex-shrink-0 h-5 w-5 transition-colors`}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={onLogout}
                  className="flex-shrink-0 w-full group flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          <main className="flex-1 relative overflow-y-auto focus:outline-none pt-16 md:pt-0">
            <div className="py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

