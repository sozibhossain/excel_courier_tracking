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
  const directionsRendererRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const sanitizedPoints = useMemo(
    () => points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points]
  )

  // Keep Directions API happy: too many waypoints will fail.
  const sampledPoints = useMemo(() => {
    const max = 23 // origin + destination + (max 23 waypoints) ~= 25 points total
    if (sanitizedPoints.length <= max) return sanitizedPoints

    const step = Math.ceil(sanitizedPoints.length / max)
    const reduced = sanitizedPoints.filter((_, i) => i % step === 0)

    // make sure last point is included
    const last = sanitizedPoints[sanitizedPoints.length - 1]
    if (reduced[reduced.length - 1] !== last) reduced.push(last)

    return reduced
  }, [sanitizedPoints])

  useEffect(() => {
    if (!containerRef.current || sampledPoints.length < 2) return

    let cancelled = false

    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return

        // Init map
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            mapTypeId: "roadmap",
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
          })
        }

        // Init directions renderer
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: mapRef.current,
            suppressMarkers: true, // we draw S/Now ourselves
            polylineOptions: {
              strokeColor: "#2563eb",
              strokeOpacity: 0.85,
              strokeWeight: 4,
            },
          })
        }

        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []

        const origin = sampledPoints[0]
        const destination = sampledPoints[sampledPoints.length - 1]

        // Markers
        markersRef.current.push(
          new google.maps.Marker({
            position: origin,
            label: "S",
            map: mapRef.current,
          })
        )

        markersRef.current.push(
          new google.maps.Marker({
            position: destination,
            label: "Now",
            map: mapRef.current,
          })
        )

        const service = new google.maps.DirectionsService()
        const waypoints = sampledPoints
          .slice(1, -1)
          .map((p) => ({ location: new google.maps.LatLng(p.lat, p.lng), stopover: false }))

        service.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result: any, status: any) => {
            if (cancelled) return
            if (status !== "OK" || !result) {
              setError(`Directions failed: ${status}`)
              // fallback: fit bounds to points at least
              const bounds = new google.maps.LatLngBounds()
              sampledPoints.forEach((p) => bounds.extend(p))
              mapRef.current.fitBounds(bounds, 30)
              return
            }

            directionsRendererRef.current.setDirections(result)
            setError(null)

            // Fit bounds to the computed route
            const bounds = new google.maps.LatLngBounds()
            result.routes[0].overview_path.forEach((pt: any) => bounds.extend(pt))
            mapRef.current.fitBounds(bounds, 30)
          }
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load map"))

    return () => {
      cancelled = true
    }
  }, [sampledPoints])

  return (
    <Card>
      <CardContent className="p-0">
        <div ref={containerRef} className="h-72 w-full" />
        {(!GOOGLE_MAPS_API_KEY || sampledPoints.length < 2 || error) && (
          <div className="p-4 text-sm text-muted-foreground">
            {error
              ? error
              : !GOOGLE_MAPS_API_KEY
                ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to view the map."
                : "Need at least 2 GPS points to draw a road route."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


// "use client";

// import { useEffect, useMemo } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   MapContainer,
//   TileLayer,
//   Polyline,
//   Marker,
//   Popup,
//   useMap,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// interface ParcelRouteMapProps {
//   points: Array<{ lat: number; lng: number; createdAt?: string }>;
// }

// /**
//  * Fix Leaflet marker icons in Next.js
//  */
// const DefaultIcon = L.icon({
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// function FitBounds({
//   points,
// }: {
//   points: Array<{ lat: number; lng: number }>;
// }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!points.length) return;
//     const bounds = L.latLngBounds(
//       points.map((p) => [p.lat, p.lng] as [number, number])
//     );
//     map.fitBounds(bounds, { padding: [20, 20] });
//   }, [points, map]);

//   return null;
// }

// export function ParcelRouteMap({ points }: ParcelRouteMapProps) {
//   const sanitizedPoints = useMemo(
//     () =>
//       points.filter(
//         (p) => typeof p.lat === "number" && typeof p.lng === "number"
//       ),
//     [points]
//   );

//   const center: [number, number] = useMemo(() => {
//     if (sanitizedPoints.length)
//       return [sanitizedPoints[0].lat, sanitizedPoints[0].lng];
//     return [23.8103, 90.4125]; // Dhaka fallback
//   }, [sanitizedPoints]);

//   const polylinePositions = useMemo(
//     () => sanitizedPoints.map((p) => [p.lat, p.lng] as [number, number]),
//     [sanitizedPoints]
//   );

//   const start = sanitizedPoints[0];
//   const latest = sanitizedPoints[sanitizedPoints.length - 1];

//   return (
//     <Card>
//       <CardContent className="p-0">
//         <div className="h-72 w-full">
//           <MapContainer
//             center={center}
//             zoom={13}
//             style={{ height: "100%", width: "100%" }}
//             scrollWheelZoom
//           >
//             <TileLayer
//               attribution="&copy; OpenStreetMap contributors"
//               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             />

//             {!!sanitizedPoints.length && <FitBounds points={sanitizedPoints} />}

//             {polylinePositions.length >= 2 && (
//               <Polyline positions={polylinePositions} />
//             )}

//             {start && (
//               <Marker position={[start.lat, start.lng]}>
//                 <Popup>Start</Popup>
//               </Marker>
//             )}

//             {latest && (
//               <Marker position={[latest.lat, latest.lng]}>
//                 <Popup>Current</Popup>
//               </Marker>
//             )}
//           </MapContainer>
//         </div>

//         {!sanitizedPoints.length && (
//           <div className="p-4 text-sm text-muted-foreground">
//             Tracking data will appear here once we receive GPS coordinates.
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
