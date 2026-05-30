import { useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import { usersApi } from '@/services/api/client'

export type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error'

export type LocationState = {
  lat: number | null
  lng: number | null
  status: LocationStatus
  error: string | null
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    status: 'idle',
    error: null,
  })

  // Prevent double-firing in StrictMode / fast-refresh.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    let cancelled = false

    async function acquire() {
      setState((s) => ({ ...s, status: 'loading' }))

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== Location.PermissionStatus.GRANTED) {
        if (!cancelled) {
          setState({ lat: null, lng: null, status: 'denied', error: 'Location permission denied' })
        }
        return
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (cancelled) return

        const { latitude: lat, longitude: lng } = pos.coords
        setState({ lat, lng, status: 'success', error: null })

        // Fire-and-forget: update the backend so the push notification
        // worker knows where to deliver nearby-post alerts.
        usersApi.updateLocation(lat, lng).catch(() => {
          // Non-critical — silently ignore network failures here.
        })
      } catch {
        if (!cancelled) {
          setState({ lat: null, lng: null, status: 'error', error: 'Could not get location' })
        }
      }
    }

    acquire()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
