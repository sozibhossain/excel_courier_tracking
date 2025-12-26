// Environment variables configuration
const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
export const API_BASE_URL = rawApiBase.replace(/\/$/, "")
export const API_ORIGIN = API_BASE_URL.replace(/\/api(\/v1)?$/, "")
export const SOCKET_BASE_URL =
  (process.env.NEXT_PUBLIC_SOCKET_BASE_URL || "").replace(/\/$/, "") || API_ORIGIN
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// Validate required environment variables in development
if (typeof window === "undefined") {
  const requiredEnvs = ["NEXT_PUBLIC_API_URL"]
  const missing = requiredEnvs.filter((env) => !process.env[env])

  if (missing.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("[v0] Missing environment variables:", missing.join(", "))
  }
}
