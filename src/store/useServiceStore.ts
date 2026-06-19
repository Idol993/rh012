import { create } from 'zustand'

export type ServiceStatus = 'pending' | 'assigned' | 'in_progress' | 'completed'
export type ServiceType = 'water' | 'towel' | 'cleaning' | 'maintenance' | 'other'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface AssignedStaff {
  id: number
  name: string
  distance: string
}

export interface ServiceRequest {
  id: number
  roomId: number
  roomNumber: string
  type: ServiceType
  description: string
  priority: Priority
  status: ServiceStatus
  assignedTo?: AssignedStaff
  createdAt: string
  completedAt?: string
}

export interface AutoDispatchResult {
  requestId: number
  assignedStaff: AssignedStaff
}

interface CreateServiceRequest {
  roomId: number
  type: ServiceType
  description: string
  priority: Priority
}

interface ServiceState {
  serviceRequests: ServiceRequest[]
  loading: boolean
  fetchRequests: () => Promise<void>
  createRequest: (data: CreateServiceRequest) => Promise<ServiceRequest>
  updateRequestStatus: (id: number, status: ServiceStatus) => Promise<void>
  autoDispatch: (id: number) => Promise<AutoDispatchResult>
}

const useServiceStore = create<ServiceState>((set) => ({
  serviceRequests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true })
    const res = await fetch('/api/service-requests')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取服务请求失败')
    }
    set({ serviceRequests: data.data, loading: false })
  },

  createRequest: async (data) => {
    const res = await fetch('/api/service-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.error || '创建服务请求失败')
    }
    const newReq = result.data
    set((state) => ({ serviceRequests: [newReq, ...state.serviceRequests] }))
    return newReq
  },

  updateRequestStatus: async (id, status) => {
    const res = await fetch(`/api/service-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '更新服务请求失败')
    }
    set((state) => ({
      serviceRequests: state.serviceRequests.map((r) =>
        r.id === id
          ? { ...r, status, completedAt: status === 'completed' ? new Date().toISOString() : r.completedAt }
          : r
      ),
    }))
  },

  autoDispatch: async (id) => {
    const res = await fetch('/api/service-requests/auto-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '自动派单失败')
    }
    const result = data.data
    if (result.assignedStaff) {
      set((state) => ({
        serviceRequests: state.serviceRequests.map((r) =>
          r.id === id ? { ...r, status: 'assigned', assignedTo: result.assignedStaff } : r
        ),
      }))
    }
    return result
  },
}))

export default useServiceStore
