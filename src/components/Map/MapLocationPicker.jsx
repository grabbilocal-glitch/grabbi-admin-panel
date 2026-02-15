import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useNominatim from '../../hooks/useNominatim'

// Fix Leaflet default marker icons for Vite bundler
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function InvalidateSizeFix() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])
  return null
}

export default function MapLocationPicker({
  value = {},
  onChange,
  showMyLocation = false,
  readOnly = false,
  height = '300px',
  className = '',
}) {
  const { lat, lng, address: currentAddress } = value
  const [searchQuery, setSearchQuery] = useState('')
  const { search, reverseGeocode, results, loading: searchLoading } = useNominatim()
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  const position = lat && lng ? [lat, lng] : null
  const center = useMemo(() => position || [53.48, -2.24], [position])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMapClick = async (latlng) => {
    if (readOnly) return
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    onChange({ lat: latlng.lat, lng: latlng.lng, address: addr })
  }

  const handleSearch = async () => {
    const res = await search(searchQuery)
    if (res.length > 0) setShowResults(true)
  }

  const handleSelectResult = (result) => {
    onChange({ lat: result.lat, lng: result.lng, address: result.address })
    setSearchQuery(result.address)
    setShowResults(false)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const addr = await reverseGeocode(latitude, longitude)
        onChange({ lat: latitude, lng: longitude, address: addr })
      },
      () => {},
      { timeout: 10000 }
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {!readOnly && (
        <div className="flex gap-2" ref={searchRef}>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Search address..."
              className="input-field text-sm"
            />
            {showResults && results.length > 0 && (
              <ul className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {results.map((r, i) => (
                  <li
                    key={i}
                    onClick={() => handleSelectResult(r)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer truncate"
                  >
                    {r.address}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searchLoading}
            className="btn-secondary text-sm"
          >
            {searchLoading ? '...' : 'Search'}
          </button>
          {showMyLocation && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="btn-secondary text-sm"
              title="Use my location"
            >
              My Location
            </button>
          )}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer
          center={center}
          zoom={position ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!readOnly}
          dragging={!readOnly}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}
          <InvalidateSizeFix />
          {position && (
            <>
              <Marker position={position} />
              <RecenterMap lat={lat} lng={lng} />
            </>
          )}
        </MapContainer>
      </div>

      {currentAddress && (
        <p className="text-xs text-gray-500 truncate">{currentAddress}</p>
      )}
    </div>
  )
}
