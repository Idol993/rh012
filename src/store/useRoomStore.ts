import { create } from 'zustand'

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved'
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential'

export interface IoTState {
  ac: { power: boolean; temperature: number; mode: 'cool' | 'heat' | 'auto' }
  light: { power: boolean; brightness: number }
  curtain: { open: boolean }
}

export interface MinibarItem {
  id: number
  name: string
  price: number
  weight: number
  currentWeight: number
  consumed: boolean
  consumedAt?: string
}

export interface CurrentGuest {
  id: number
  name: string
  phone: string
  memberId?: number
}

export interface ReservationContext {
  reservationId: number
  checkIn: string
  checkOut: string
  keyType?: string
  memberTier?: string
}

export interface Room {
  id: number
  roomNumber: string
  floor: number
  roomType: RoomType
  status: RoomStatus
  isSmoking: boolean
  hasFirmPillow: boolean
  currentGuest?: CurrentGuest | null
  iotDevices: IoTState
  minibar: MinibarItem[]
  lastCleanedAt?: string | null
  pricePerNight: number
  reservation?: ReservationContext | null
}

export interface TimelineEvent {
  time: string
  type: 'minibar' | 'service' | 'housekeeping' | 'iot'
  title: string
  detail: string
  iconHint: string
  status?: string
  completedAt?: string | null
  qualityScore?: number | null
}

export interface RoomTimeline {
  roomId: number
  roomNumber: string
  events: TimelineEvent[]
}

interface RoomState {
  rooms: Room[]
  selectedRoom: Room | null
  selectedTimeline: TimelineEvent[]
  loading: boolean
  fetchRooms: () => Promise<void>
  fetchRoom: (id: number) => Promise<Room>
  fetchTimeline: (id: number) => Promise<void>
  selectRoom: (id: number) => void
  deselectRoom: () => void
  updateRoomStatus: (id: number, status: RoomStatus) => Promise<void>
  updateIoT: (id: number, device: 'ac' | 'light' | 'curtain', settings: Record<string, any>) => Promise<void>
  preArrival: (id: number, acTemperature?: number, lightBrightness?: number) => Promise<void>
}

const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  selectedRoom: null,
  selectedTimeline: [],
  loading: false,

  fetchRooms: async () => {
    set({ loading: true })
    const res = await fetch('/api/rooms')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取房间列表失败')
    }
    set({ rooms: data.data, loading: false })
  },

  fetchRoom: async (id: number) => {
    const res = await fetch(`/api/rooms/${id}`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '获取房间详情失败')
    }
    return data.data
  },

  fetchTimeline: async (id: number) => {
    const res = await fetch(`/api/rooms/${id}/timeline`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '获取时间线失败')
    }
    set({ selectedTimeline: data.data.events || [] })
  },

  selectRoom: (id) => {
    const room = get().rooms.find((r) => r.id === id) || null
    set({ selectedRoom: room })
    if (room) {
      get().fetchTimeline(id).catch(() => set({ selectedTimeline: [] }))
    }
  },

  deselectRoom: () => {
    set({ selectedRoom: null, selectedTimeline: [] })
  },

  updateRoomStatus: async (id, status) => {
    const res = await fetch(`/api/rooms/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '更新房间状态失败')
    }
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, status } : r)),
      selectedRoom: state.selectedRoom?.id === id ? { ...state.selectedRoom, status } : state.selectedRoom,
    }))
  },

  updateIoT: async (id, device, settings) => {
    const res = await fetch(`/api/rooms/${id}/iot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device, settings }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '更新IoT设备失败')
    }
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id ? { ...r, iotDevices: { ...r.iotDevices, [device]: { ...r.iotDevices[device as keyof IoTState], ...settings } } } : r
      ),
      selectedRoom: state.selectedRoom?.id === id
        ? { ...state.selectedRoom, iotDevices: { ...state.selectedRoom.iotDevices, [device]: { ...state.selectedRoom.iotDevices[device as keyof IoTState], ...settings } } }
        : state.selectedRoom,
    }))
  },

  preArrival: async (id, acTemperature = 22, lightBrightness = 40) => {
    const res = await fetch(`/api/rooms/${id}/pre-arrival`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acTemperature, lightBrightness }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '预入住设置失败')
    }
  },
}))

export default useRoomStore
