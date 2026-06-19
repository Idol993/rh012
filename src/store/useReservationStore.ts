import { create } from 'zustand'

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export interface Reservation {
  id: string
  guestName: string
  guestPhone: string
  roomType: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
  roomId?: string
  memberTier?: string
  preferences: string[]
  createdAt: string
}

interface ReservationState {
  reservations: Reservation[]
  currentReservation: Reservation | null
  loading: boolean
  fetchReservations: () => Promise<void>
  createReservation: (data: Partial<Reservation>) => Promise<Reservation>
  autoAssign: (id: string) => Promise<{ roomId: string; matchScore: number }[]>
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<void>
}

const generateReservations = (): Reservation[] => {
  const names = ['张伟', '李娜', '王芳', '刘洋', '陈明', '赵雪', '孙鹏', '周丽', '吴强', '郑慧', '黄磊', '林涛']
  const types = ['标准间', '豪华间', '套房', '总统套房']
  const statuses: ReservationStatus[] = ['pending', 'confirmed', 'confirmed', 'checked_in', 'checked_out']
  const prefs = ['高楼层', '无烟', '硬枕', '低楼层', '吸烟', '软枕']
  return names.map((name, i) => ({
    id: `RES-${String(1000 + i)}`,
    guestName: name,
    guestPhone: `138${String(10000000 + i * 123456).slice(0, 8)}`,
    roomType: types[i % types.length],
    checkIn: '2026-06-19',
    checkOut: '2026-06-22',
    status: statuses[i % statuses.length],
    roomId: statuses[i % statuses.length] === 'checked_in' ? `room-${3}${String(i % 5 + 1).padStart(2, '0')}` : undefined,
    memberTier: i % 3 === 0 ? 'gold' : i % 5 === 0 ? 'platinum' : undefined,
    preferences: [prefs[i % prefs.length], prefs[(i + 2) % prefs.length]],
    createdAt: '2026-06-15',
  }))
}

const useReservationStore = create<ReservationState>((set) => ({
  reservations: [],
  currentReservation: null,
  loading: false,

  fetchReservations: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/reservations')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ reservations: data, loading: false })
    } catch {
      set({ reservations: generateReservations(), loading: false })
    }
  },

  createReservation: async (data) => {
    const newRes: Reservation = {
      id: `RES-${String(2000 + Math.floor(Math.random() * 1000))}`,
      guestName: data.guestName || '',
      guestPhone: data.guestPhone || '',
      roomType: data.roomType || '标准间',
      checkIn: data.checkIn || '2026-06-19',
      checkOut: data.checkOut || '2026-06-22',
      status: 'confirmed',
      preferences: data.preferences || [],
      createdAt: new Date().toISOString().split('T')[0],
    }
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRes),
      })
      if (res.ok) {
        const saved = await res.json()
        set((state) => ({ reservations: [...state.reservations, saved] }))
        return saved
      }
    } catch {}
    set((state) => ({ reservations: [...state.reservations, newRes] }))
    return newRes
  },

  autoAssign: async (id) => {
    try {
      const res = await fetch(`/api/reservations/${id}/auto-assign`)
      if (res.ok) return await res.json()
    } catch {}
    return [
      { roomId: 'room-301', matchScore: 95 },
      { roomId: 'room-501', matchScore: 82 },
      { roomId: 'room-702', matchScore: 68 },
    ]
  },

  updateReservation: async (id, data) => {
    try {
      await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {}
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }))
  },
}))

export default useReservationStore
