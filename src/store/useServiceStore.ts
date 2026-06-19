import { create } from 'zustand'

export type ServiceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed'
export type ServiceType = 'room_service' | 'laundry' | 'maintenance' | 'minibar' | 'wake_up' | 'luggage' | 'other'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface ServiceRequest {
  id: string
  roomId: string
  roomNumber: string
  type: ServiceType
  description: string
  status: ServiceStatus
  priority: Priority
  assignedTo?: string
  createdAt: string
  completedAt?: string
}

interface ServiceState {
  serviceRequests: ServiceRequest[]
  loading: boolean
  fetchRequests: () => Promise<void>
  createRequest: (data: Partial<ServiceRequest>) => Promise<void>
  updateRequestStatus: (id: string, status: ServiceStatus) => Promise<void>
  autoDispatch: (id: string) => Promise<{ staffName: string; distance: string }[]>
}

const generateRequests = (): ServiceRequest[] => {
  const types: ServiceType[] = ['room_service', 'laundry', 'maintenance', 'minibar', 'wake_up', 'luggage']
  const descs: Record<ServiceType, string> = {
    room_service: '送餐至房间',
    laundry: '收取洗衣',
    maintenance: '维修浴室水龙头',
    minibar: '补充迷你吧',
    wake_up: '明日6:00叫醒',
    luggage: '协助搬运行李',
    other: '其他服务',
  }
  const statuses: ServiceStatus[] = ['pending', 'pending', 'assigned', 'in_progress', 'completed']
  const priorities: Priority[] = ['low', 'medium', 'medium', 'high', 'urgent']
  const staff = ['小李', '小王', '小张', '小陈']
  return Array.from({ length: 12 }, (_, i) => {
    const type = types[i % types.length]
    const status = statuses[i % statuses.length]
    return {
      id: `SRV-${String(100 + i)}`,
      roomId: `room-${Math.ceil((i + 1) / 5)}${String((i % 5) + 1).padStart(2, '0')}`,
      roomNumber: `${Math.ceil((i + 1) / 5)}${String((i % 5) + 1).padStart(2, '0')}`,
      type,
      description: descs[type],
      status,
      priority: priorities[i % priorities.length],
      assignedTo: status !== 'pending' ? staff[i % staff.length] : undefined,
      createdAt: `2026-06-19T${String(8 + i).padStart(2, '0')}:${String(i * 5 % 60).padStart(2, '0')}:00`,
    }
  })
}

const useServiceStore = create<ServiceState>((set) => ({
  serviceRequests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/service-requests')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ serviceRequests: data, loading: false })
    } catch {
      set({ serviceRequests: generateRequests(), loading: false })
    }
  },

  createRequest: async (data) => {
    const newReq: ServiceRequest = {
      id: `SRV-${String(200 + Math.floor(Math.random() * 1000))}`,
      roomId: data.roomId || '',
      roomNumber: data.roomNumber || '',
      type: data.type || 'other',
      description: data.description || '',
      status: 'pending',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
    }
    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq),
      })
      if (res.ok) {
        const saved = await res.json()
        set((state) => ({ serviceRequests: [saved, ...state.serviceRequests] }))
        return
      }
    } catch {}
    set((state) => ({ serviceRequests: [newReq, ...state.serviceRequests] }))
  },

  updateRequestStatus: async (id, status) => {
    try {
      await fetch(`/api/service-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {}
    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === id ? { ...r, status, completedAt: status === 'completed' ? new Date().toISOString() : r.completedAt } : r
      ),
    }))
  },

  autoDispatch: async (id) => {
    try {
      const res = await fetch(`/api/service-requests/${id}/auto-dispatch`)
      if (res.ok) return await res.json()
    } catch {}
    return [
      { staffName: '小李', distance: '3楼' },
      { staffName: '小张', distance: '5楼' },
    ]
  },
}))

export default useServiceStore
