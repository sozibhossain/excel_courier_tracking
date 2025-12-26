"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { GOOGLE_MAPS_API_KEY } from "@/lib/env"
import { Card, CardContent } from "@/components/ui/card"

declare global {
  interface Window {
    google?: any
  }
}

let mapsLoader: Promise<any> | null = null

const loadGoogleMaps = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is not available"))
  if (window.google?.maps) return Promise.resolve(window.google)
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Google Maps key missing"))

  if (!mapsLoader) {
    mapsLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`
      script.async = true
      script.onload = () => resolve(window.google)
      script.onerror = (event) => reject(event)
      document.body.appendChild(script)
    }).catch((error) => {
      mapsLoader = null
      throw error
    })
  }

  return mapsLoader
}

interface ParcelRouteMapProps {
  points: Array<{ lat: number; lng: number; createdAt?: string }>
}

export function ParcelRouteMap({ points }: ParcelRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const sanitizedPoints = useMemo(
    () => points.filter((point) => typeof point.lat === "number" && typeof point.lng === "number"),
    [points]
  )

  useEffect(() => {
    if (!containerRef.current || !sanitizedPoints.length) return

    let cancelled = false
    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return
        const bounds = new google.maps.LatLngBounds()
        sanitizedPoints.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            zoom: 12,
            center: bounds.getCenter(),
            disableDefaultUI: true,
          })
        }

        mapRef.current.fitBounds(bounds)

        if (!polylineRef.current) {
          polylineRef.current = new google.maps.Polyline({
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapRef.current,
          })
        }

        polylineRef.current.setPath(sanitizedPoints.map((p) => ({ lat: p.lat, lng: p.lng })))

        markersRef.current.forEach((marker) => marker.setMap(null))
        markersRef.current = []

        const [start, ...rest] = sanitizedPoints
        const latest = rest[rest.length - 1] ?? start

        if (start) {
          markersRef.current.push(
            new google.maps.Marker({
              position: { lat: start.lat, lng: start.lng },
              label: "S",
              map: mapRef.current,
            })
          )
        }

        if (latest) {
          markersRef.current.push(
            new google.maps.Marker({
              position: { lat: latest.lat, lng: latest.lng },
              label: "Now",
              map: mapRef.current,
            })
          )
        }

        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load map"))

    return () => {
      cancelled = true
    }
  }, [sanitizedPoints])

  return (
    <Card>
      <CardContent className="p-0">
        <div ref={containerRef} className="h-72 w-full" />
        {(!GOOGLE_MAPS_API_KEY || !sanitizedPoints.length || error) && (
          <div className="p-4 text-sm text-muted-foreground">
            {error
              ? error
              : !GOOGLE_MAPS_API_KEY
                ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to view the map."
                : "Tracking data will appear here once we receive GPS coordinates."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
