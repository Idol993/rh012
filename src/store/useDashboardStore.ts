import { create } from 'zustand'

export interface OccupancyData {
  current: number
  yesterday: number
  trend: number[]
}

export interface RevPARData {
  current: number
  yesterday: number
  adr: number
  trend: number[]
}

export interface ReviewPlatform {
  name: string
  score: number
  count: number
}

export interface ReviewKeyword {
  word: string
  weight: number
}

export interface ReviewsData {
  average: number
  platforms: ReviewPlatform[]
  trend: number[]
  keywords: ReviewKeyword[]
}

export interface FloorEnergy {
  floor: number
  consumption: number
}

export interface EnergyAlert {
  message: string
  level: string
}

export interface EnergyData {
  total: number
  byFloor: FloorEnergy[]
  alerts: EnergyAlert[]
}

export interface RevenueData {
  roomRevenue: number
  minibarRevenue: number
  serviceRevenue: number
  total: number
}

export interface ServiceRequestSummary {
  pending: number
  assigned: number
  in_progress: number
  completed: number
}

export interface ServiceMonitorItem {
  id: number
  roomNumber: string
  type: string
  priority: string
  status: string
  description: string
  assignedTo: { id: number; name: string } | null
  createdAt: string
  completedAt: string | null
}

export interface ServiceMonitorData {
  summary: ServiceRequestSummary
  items: ServiceMonitorItem[]
}

export interface GMDashboardData {
  occupancy: OccupancyData
  revpar: RevPARData
  reviews: ReviewsData
  energy: EnergyData
  revenue: RevenueData
  serviceRequests: ServiceMonitorData
}

export interface NightAuditReport {
  date: string
  occupancy: number
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  roomRevenue: number
  minibarRevenue: number
  otherRevenue: number
  totalRevenue: number
  revpar: number
  adr: number
  checkIns: number
  checkOuts: number
  cancellations: number
}

export interface ExportResult {
  downloadUrl: string
  generatedAt: string
  message: string
}

interface DashboardState {
  dashboardData: GMDashboardData | null
  nightAuditReport: NightAuditReport | null
  loading: boolean
  fetchDashboardData: () => Promise<void>
  fetchNightAudit: () => Promise<void>
  exportReport: (type: string, format: 'pdf' | 'excel') => Promise<void>
}

const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  nightAuditReport: null,
  loading: false,

  fetchDashboardData: async () => {
    set({ loading: true })
    const res = await fetch('/api/gm/dashboard')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取仪表盘数据失败')
    }
    set({ dashboardData: data.data, loading: false })
  },

  fetchNightAudit: async () => {
    set({ loading: true })
    const res = await fetch('/api/gm/night-audit')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取夜审报表失败')
    }
    set({ nightAuditReport: data.data, loading: false })
  },

  exportReport: async (type, format) => {
    const res = await fetch('/api/gm/export-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, format }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '导出报表失败')
    }
    const result: ExportResult = data.data
    if (result.downloadUrl) {
      const urlParts = result.downloadUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      const downloadApiUrl = `/api/gm/download/${filename}`
      const fileRes = await fetch(downloadApiUrl)
      if (!fileRes.ok) {
        throw new Error('下载文件失败')
      }
      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename || `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    }
  },
}))

export default useDashboardStore
