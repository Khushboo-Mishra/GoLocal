import axios from 'axios'
import { useAuth } from '@clerk/clerk-expo'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Call this once after Clerk is ready to attach the JWT to every request
export function setupAuthInterceptor(getToken: () => Promise<string | null>) {
  apiClient.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Auto sign-out on 401
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // TODO: trigger sign-out from auth store
        console.warn('[API] 401 — token expired or invalid')
      }
      return Promise.reject(error)
    }
  )
}

// ── Feed ────────────────────────────────────────────────────
export const feedApi = {
  getNearby: (params: { lat: number; lng: number; radius: number; type?: string; cursor?: string }) =>
    apiClient.get('/feed', { params }).then((r) => r.data),

  getTrending: (params: { lat: number; lng: number; radius: number }) =>
    apiClient.get('/feed/trending', { params }).then((r) => r.data),

  getGoing: (cursor?: string) =>
    apiClient.get('/feed/going', { params: { cursor } }).then((r) => r.data),
}

// ── Posts ───────────────────────────────────────────────────
export const postsApi = {
  create: (formData: FormData) =>
    apiClient.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/posts/${id}`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/posts/${id}`).then((r) => r.data),

  like: (id: string) =>
    apiClient.post(`/posts/${id}/like`).then((r) => r.data),

  save: (id: string) =>
    apiClient.post(`/posts/${id}/save`).then((r) => r.data),

  report: (id: string, reason: string) =>
    apiClient.post(`/posts/${id}/report`, { reason }).then((r) => r.data),
}

// ── Users ───────────────────────────────────────────────────
export const usersApi = {
  sync: (name: string, avatarUrl?: string) =>
    apiClient.post('/auth/sync', { name, avatarUrl }).then((r) => r.data),

  getMe: () =>
    apiClient.get('/users/me').then((r) => r.data),

  updateMe: (data: { name?: string; radiusMiles?: number }) =>
    apiClient.patch('/users/me', data).then((r) => r.data),

  updateLocation: (lat: number, lng: number) =>
    apiClient.post('/users/me/location', { lat, lng }).then((r) => r.data),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    apiClient.post('/users/me/push-token', { token, platform }).then((r) => r.data),

  uploadAvatar: (formData: FormData) =>
    apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
}
