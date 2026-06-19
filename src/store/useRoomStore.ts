import { create } from 'zustand'

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved'
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential'

export interface IoTState {
  ac: { power: boolean; temperature: number; mode: 'cool' | 'heat' | 'auto' }
  light: { power: boolean; brightness: number }
  curtain: boolean
}

export interface Room {
  id: string
  number: string
  floor: number
  type: RoomType
  status: RoomStatus
  guestName?: string
  guestId?: string
  iot: IoTState
  minibar: { item: string; quantity: number; price: number }[]
  notes?: string
}

interface RoomState {
  rooms: Room[]
  selectedRoom: Room | null
  loading: boolean
  fetchRooms: () => Promise<void>
  selectRoom: (id: string) => void
  updateRoomStatus: (id: string, status: RoomStatus) => Promise<void>
  updateIoT: (id: string, device: string, settings: Partial<IoTState>) => Promise<void>
  preArrival: (id: string) => Promise<void>
}

const generateRooms = (): Room[] => {
  const rooms: Room[] = []
  const types: RoomType[] = ['standard', 'standard', 'deluxe', 'suite', 'presidential']
  const statuses: RoomStatus[] = ['available', 'occupied', 'occupied', 'cleaning', 'available', 'reserved', 'maintenance']
  const guests = ['张伟', '李娜', '王芳', '刘洋', '陈明', '赵雪', '孙鹏', '周丽', '吴强', '郑慧']
  for (let floor = 1; floor <= 8; floor++) {
    for (let room = 1; room <= 5; room++) {
      const num = `${floor}${String(room).padStart(2, '0')}`
      const statusIdx = (floor * 5 + room) % statuses.length
      const isOccupied = statuses[statusIdx] === 'occupied'
      rooms.push({
        id: `room-${num}`,
        number: num,
        floor,
        type: types[room - 1],
        status: statuses[statusIdx],
        guestName: isOccupied ? guests[(floor + room) % guests.length] : undefined,
        iot: {
          ac: { power: isOccupied, temperature: 22 + (room % 4), mode: 'cool' },
          light: { power: isOccupied, brightness: isOccupied ? 60 + (room * 10) : 0 },
          curtain: isOccupied,
        },
        minibar: isOccupied
          ? [{ item: '矿泉水', quantity: 2, price: 10 }, { item: '可乐', quantity: 1, price: 15 }]
          : [],
      })
    }
  }
  return rooms
}

const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  selectedRoom: null,
  loading: false,

  fetchRooms: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ rooms: data, loading: false })
    } catch {
      set({ rooms: generateRooms(), loading: false })
    }
  },

  selectRoom: (id) => {
    const room = get().rooms.find((r) => r.id === id) || null
    set({ selectedRoom: room })
  },

  updateRoomStatus: async (id, status) => {
    try {
      await fetch(`/api/rooms/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {}
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, status } : r)),
      selectedRoom: state.selectedRoom?.id === id ? { ...state.selectedRoom, status } : state.selectedRoom,
    }))
  },

  updateIoT: async (id, device, settings) => {
    try {
      await fetch(`/api/rooms/${id}/iot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, settings }),
      })
    } catch {}
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id ? { ...r, iot: { ...r.iot, ...settings } } : r
      ),
      selectedRoom: state.selectedRoom?.id === id
        ? { ...state.selectedRoom, iot: { ...state.selectedRoom.iot, ...settings } }
        : state.selectedRoom,
    }))
  },

  preArrival: async (id) => {
    try {
      await fetch(`/api/rooms/${id}/pre-arrival`, { method: 'POST' })
    } catch {}
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === id
          ? { ...r, iot: { ...r.iot, ac: { ...r.iot.ac, power: true, temperature: 22, mode: 'cool' as const }, light: { ...r.iot.light, power: true, brightness: 40 }, curtain: false } }
          : r
      ),
    }))
  },
}))

export default useRoomStore
