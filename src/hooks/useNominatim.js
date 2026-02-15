import { useState, useRef, useCallback } from 'react'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'
const MIN_INTERVAL_MS = 1100 // >1 req/s to respect Nominatim policy

export default function useNominatim() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const lastRequestRef = useRef(0)

  const throttle = async () => {
    const now = Date.now()
    const elapsed = now - lastRequestRef.current
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed))
    }
    lastRequestRef.current = Date.now()
  }

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setResults([])
      return []
    }
    setLoading(true)
    try {
      await throttle()
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        addressdetails: '1',
        limit: '5',
      })
      const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
        headers: { 'Accept-Language': 'en' },
      })
      const data = await res.json()
      const mapped = data.map((item) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
      }))
      setResults(mapped)
      return mapped
    } catch {
      setResults([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      await throttle()
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: 'json',
        addressdetails: '1',
      })
      const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
        headers: { 'Accept-Language': 'en' },
      })
      const data = await res.json()
      return data.display_name || ''
    } catch {
      return ''
    }
  }, [])

  return { search, reverseGeocode, results, loading }
}
