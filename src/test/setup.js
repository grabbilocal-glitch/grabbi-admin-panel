import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from './mocks/server'

// Mock react-leaflet — Leaflet needs real DOM APIs unavailable in jsdom
vi.mock('react-leaflet', () => {
  const React = require('react')
  return {
    MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => null,
    Marker: () => null,
    useMapEvents: () => null,
    useMap: () => ({ invalidateSize: () => {}, setView: () => {}, getZoom: () => 13 }),
  }
})

vi.mock('leaflet', () => {
  const Icon = { Default: { prototype: { _getIconUrl: '' }, mergeOptions: () => {} } }
  return { default: { Icon }, Icon }
})

// Ensure localStorage is available for api.js module-level code
if (typeof globalThis.localStorage === 'undefined') {
  const store = {}
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (i) => Object.keys(store)[i] || null,
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
