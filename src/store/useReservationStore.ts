import { create } from 'zustand'
import type { RoomType } from './useRoomStore'

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export interface Reservation {
  id: number
  guestName: string
  memberId?: number
  phone: string
  checkIn: string
  checkOut: string
  roomType: RoomType
  status: ReservationStatus
  preferences: string[]
  roomId?: number
  roomNumber?: string
  keyType?: string
  totalAmount?: number
  createdAt: string
}

export interface AutoAssignResult {
  roomId: number
  roomNumber: string
  matchScore: number
  matchDetails: { preference: string; matched: boolean }[]
}

export interface CheckInResult {
  success: boolean
  roomNumber: string
  keyInfo: { type: string; code: string }
}

export interface CheckOutResult {
  success: boolean
  totalBill: number
  invoiceUrl: string
  pointsEarned: number
  memberUpgraded: boolean
  newTier?: string
}

interface CreateReservationRequest {
  guestName: string
  phone: string
  checkIn: string
  checkOut: string
  roomType: RoomType
  preferences?: string[]
  memberId?: number
}

interface ReservationState {
  reservations: Reservation[]
  currentReservation: Reservation | null
  loading: boolean
  fetchReservations: () => Promise<void>
  createReservation: (data: CreateReservationRequest) => Promise<Reservation>
  updateReservation: (id: number, data: Partial<Reservation>) => Promise<Reservation>
  autoAssign: (id: number) => Promise<AutoAssignResult>
  checkIn: (reservationId: number, faceVerified: boolean, keyType: 'card' | 'bluetooth') => Promise<CheckInResult>
  checkOut: (reservationId: number) => Promise<CheckOutResult>
}

const useReservationStore = create<ReservationState>((set) => ({
  reservations: [],
  currentReservation: null,
  loading: false,

  fetchReservations: async () => {
    set({ loading: true })
    const res = await fetch('/api/reservations')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取预订列表失败')
    }
    set({ reservations: data.data, loading: false })
  },

  createReservation: async (data) => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || '创建预订失败')
    }
    const newReservation = result.data
    set((state) => ({ reservations: [...state.reservations, newReservation] }))
    return newReservation
  },

  updateReservation: async (id, data) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || '更新预订失败')
    }
    const updated = result.data
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? updated : r)),
    }))
    return updated
  },

  autoAssign: async (id) => {
    const res = await fetch(`/api/reservations/${id}/auto-assign`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '智能分配失败')
    }
    return data.data
  },

  checkIn: async (reservationId, faceVerified, keyType) => {
    const res = await fetch('/api/checkin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, faceVerified, keyType }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '入住失败')
    }
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'checked_in' } : r
      ),
    }))
    return data.data
  },

  checkOut: async (reservationId) => {
    const res = await fetch('/api/checkin/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '退房失败')
    }
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'checked_out' } : r
      ),
    }))
    return data.data
  },
}))

export default useReservationStore
