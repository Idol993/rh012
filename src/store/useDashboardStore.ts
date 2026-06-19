import { create } from 'zustand'

export interface DashboardData {
  todayCheckIns: number
  todayCheckOuts: number
  occupancyRate: number
  availableRooms: number
  totalRooms: number
  revenue: number
  pendingServices: number
  avgRoomRate: number
}

export interface NightAuditRecord {
  date: string
  occupancy: number
  roomRevenue: number
  fbRevenue: number
  otherRevenue: number
  revPAR: number
  adr: number
  checkIns: number
  checkOuts: number
}

interface DashboardState {
  dashboardData: DashboardData | null
  nightAuditData: NightAuditRecord[]
  loading: boolean
  fetchDashboardData: () => Promise<void>
  fetchNightAudit: () => Promise<void>
  exportReport: (format: 'pdf' | 'excel') => Promise<void>
}

const useDashboardStore = create<DashboardState>((set) => ({
  dashboardData: null,
  nightAuditData: [],
  loading: false,

  fetchDashboardData: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ dashboardData: data, loading: false })
    } catch {
      set({
        dashboardData: {
          todayCheckIns: 12,
          todayCheckOuts: 8,
          occupancyRate: 78.5,
          availableRooms: 17,
          totalRooms: 40,
          revenue: 128500,
          pendingServices: 6,
          avgRoomRate: 680,
        },
        loading: false,
      })
    }
  },

  fetchNightAudit: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/night-audit')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ nightAuditData: data, loading: false })
    } catch {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })
      set({
        nightAuditData: days.map((date, i) => ({
          date,
          occupancy: 70 + Math.floor(Math.random() * 20),
          roomRevenue: 25000 + Math.floor(Math.random() * 15000),
          fbRevenue: 5000 + Math.floor(Math.random() * 3000),
          otherRevenue: 1000 + Math.floor(Math.random() * 2000),
          revPAR: 500 + Math.floor(Math.random() * 200),
          adr: 600 + Math.floor(Math.random() * 150),
          checkIns: 8 + Math.floor(Math.random() * 8),
          checkOuts: 6 + Math.floor(Math.random() * 6),
        })),
        loading: false,
      })
    }
  },

  exportReport: async (format) => {
    try {
      const res = await fetch(`/api/reports/export?format=${format}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
  },
}))

export default useDashboardStore
