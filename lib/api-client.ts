import { API_BASE_URL } from "./env"

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`)

const buildApiUrl = (path: string, params?: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${API_BASE_URL}${normalizePath(path)}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

const buildQuery = (params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return ""
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ""
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  _id: string
  id?: string
  email: string
  name: string
  role: "ADMIN" | "AGENT" | "CUSTOMER"
  phone?: string
  avatar?: string
  language?: "EN" | "BN"
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  unreadCount?: number
}

export type ParcelStatus =
  | "BOOKED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"

export interface AddressSummary {
  _id: string
  label: string
  fullAddress: string
  city: string
  area: string
  postalCode: string
  lat?: number
  lng?: number
}

export interface UserSummary {
  _id: string
  name: string
  email: string
  role: User["role"]
  isActive?: boolean
}

export interface ParcelSummary {
  _id: string
  trackingCode: string
  status: ParcelStatus
  customerId?: UserSummary
  assignedAgentId?: UserSummary
  pickupAddressId?: AddressSummary
  deliveryAddressId?: AddressSummary
  weight?: number
  codAmount?: number
  paymentType?: string
  barcodeData?: string
  qrCodeData?: string
  scheduledPickupAt?: string
  deliveredAt?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
}

export interface ParcelStatusHistoryEntry {
  _id: string
  status: ParcelStatus
  note?: string
  createdAt: string
  changedByUserId?: string
}

export interface TrackingPoint {
  _id: string
  parcelId: string
  agentId?: string
  lat: number
  lng: number
  speed?: number
  heading?: number
  createdAt: string
}

export interface ParcelTrackingResponse {
  parcel: ParcelSummary
  history: ParcelStatusHistoryEntry[]
  tracking: {
    latest: TrackingPoint | null
    history: TrackingPoint[]
  }
}

export interface DashboardMetrics {
  dailyBookings: number
  failedDeliveries: number
  codTotal: number
  deliveredTotal: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta | undefined
}

export interface NotificationItem {
  _id: string
  type: string
  title: string
  body?: string
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  createdAt: string
}

// Auth endpoints
export async function loginUser(email: string, password: string) {
  const res = await fetch(buildApiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) throw new Error("Login failed")
  const data: ApiResponse<{ tokens: AuthTokens; user: User }> = await res.json()
  return data.data
}

export async function registerUser(name: string, email: string, password: string, phone: string) {
  const res = await fetch(buildApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone }),
  })

  if (!res.ok) throw new Error("Registration failed")
  return res.json()
}

export async function getCurrentUser(token: string) {
  const res = await fetch(buildApiUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch user")
  const data: ApiResponse<User> = await res.json()
  return data.data
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(buildApiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })

  if (!res.ok) throw new Error("Token refresh failed")
  const data: ApiResponse<{ tokens: AuthTokens }> = await res.json()
  return data.data.tokens
}

export async function logoutUser(token: string) {
  await fetch(buildApiUrl("/auth/logout"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Fetch wrapper with auth
export async function authenticatedFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchAdminMetrics(token: string): Promise<DashboardMetrics> {
  const response = await authenticatedFetch("/admin/metrics/dashboard", token)
  if (!response.ok) throw new Error("Failed to fetch dashboard metrics")
  const payload: ApiResponse<DashboardMetrics> = await response.json()
  return payload.data
}

type ParcelQuery = Partial<{
  page: number
  limit: number
  status: ParcelStatus
  agentId: string
  customerId: string
  dateFrom: string
  dateTo: string
}>

export async function fetchAdminParcels(token: string, params?: ParcelQuery): Promise<PaginatedResponse<ParcelSummary>> {
  const response = await authenticatedFetch(`/admin/parcels${params ? buildQuery(params) : ""}`, token)
  if (!response.ok) throw new Error("Failed to fetch parcels")
  const payload: ApiResponse<ParcelSummary[]> = await response.json()
  return { data: payload.data ?? [], meta: payload.meta }
}

export async function fetchAdminUsers(
  token: string,
  params?: { page?: number; limit?: number; role?: User["role"] }
): Promise<PaginatedResponse<UserSummary>> {
  const response = await authenticatedFetch(`/admin/users${params ? buildQuery(params) : ""}`, token)
  if (!response.ok) throw new Error("Failed to fetch users")
  const payload: ApiResponse<UserSummary[]> = await response.json()
  return { data: payload.data ?? [], meta: payload.meta }
}

export async function fetchAgentParcels(
  token: string,
  params?: { page?: number; limit?: number; status?: ParcelStatus }
): Promise<PaginatedResponse<ParcelSummary>> {
  const response = await authenticatedFetch(`/agent/parcels${params ? buildQuery(params) : ""}`, token)
  if (!response.ok) throw new Error("Failed to fetch agent parcels")
  const payload: ApiResponse<ParcelSummary[]> = await response.json()
  return { data: payload.data ?? [], meta: payload.meta }
}

export async function assignAgentToParcel(token: string, parcelId: string, agentId: string) {
  const response = await authenticatedFetch(`/admin/parcels/${parcelId}/assign-agent`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  })

  if (!response.ok) throw new Error("Failed to assign agent")
  const payload: ApiResponse<ParcelSummary> = await response.json()
  return payload.data
}

export async function updateAdminUser(
  token: string,
  userId: string,
  payload: { role?: User["role"]; isActive?: boolean }
) {
  const response = await authenticatedFetch(`/admin/users/${userId}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error("Failed to update user")
  const data: ApiResponse<UserSummary> = await response.json()
  return data.data
}

export async function deleteAdminUser(token: string, userId: string) {
  const response = await authenticatedFetch(`/admin/users/${userId}`, token, {
    method: "DELETE",
  })

  if (!response.ok) throw new Error("Failed to delete user")
  const data: ApiResponse<UserSummary> = await response.json()
  return data.data
}

export async function deleteAdminParcel(token: string, parcelId: string) {
  const response = await authenticatedFetch(`/admin/parcels/${parcelId}`, token, {
    method: "DELETE",
  })

  if (!response.ok) throw new Error("Failed to delete parcel")
  const payload: ApiResponse<ParcelSummary> = await response.json()
  return payload.data
}


export async function fetchNotifications(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<NotificationItem>> {
  const response = await authenticatedFetch(`/notifications${params ? buildQuery(params) : ""}`, token)
  if (!response.ok) throw new Error("Failed to fetch notifications")
  const payload: ApiResponse<NotificationItem[]> = await response.json()
  return { data: payload.data ?? [], meta: payload.meta }
}

export async function markNotificationRead(token: string, notificationId: string) {
  const response = await authenticatedFetch(`/notifications/${notificationId}/mark`, token, {
    method: "PATCH",
  })
  if (!response.ok) throw new Error("Failed to update notification")
  const payload: ApiResponse<NotificationItem> = await response.json()
  return { data: payload.data, meta: payload.meta }
}

export async function markAllNotifications(token: string) {
  const response = await authenticatedFetch(`/notifications/mark-all`, token, {
    method: "PATCH",
  })
  if (!response.ok) throw new Error("Failed to mark notifications")
  const payload: ApiResponse<{ success: boolean }> = await response.json()
  return payload.meta
}


export async function fetchCustomerParcels(
  token: string,
  params?: { page?: number; limit?: number; status?: ParcelStatus; dateFrom?: string; dateTo?: string }
): Promise<PaginatedResponse<ParcelSummary>> {
  const response = await authenticatedFetch(`/parcels/my${params ? buildQuery(params) : ""}`, token)
  if (!response.ok) throw new Error("Failed to fetch customer parcels")
  const payload: ApiResponse<ParcelSummary[]> = await response.json()
  return { data: payload.data ?? [], meta: payload.meta }
}

export interface AddressInput {
  label: string
  fullAddress: string
  city: string
  area: string
  postalCode: string
  lat?: number
  lng?: number
}

export interface CreateParcelPayload {
  pickupAddress: AddressInput
  deliveryAddress: AddressInput
  parcelType: string
  parcelSize: string
  paymentType: "COD" | "PREPAID"
  codAmount?: number
  weight?: number
  scheduledPickupAt?: string
}

export async function createParcelBooking(token: string, payload: CreateParcelPayload) {
  const response = await authenticatedFetch("/parcels", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error("Failed to create parcel booking")
  const data: ApiResponse<ParcelSummary> = await response.json()
  return data.data
}

export async function fetchParcelTrackingByCode(token: string, trackingCode: string) {
  const response = await authenticatedFetch(`/parcels/tracking-code/${trackingCode}`, token)
  if (!response.ok) throw new Error("Failed to fetch tracking details")
  const payload: ApiResponse<ParcelTrackingResponse> = await response.json()
  return payload.data
}
