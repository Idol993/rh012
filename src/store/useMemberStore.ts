import { create } from 'zustand'

export type MemberTier = 'silver' | 'gold' | 'platinum' | 'diamond'

export interface Member {
  id: number
  name: string
  phone: string
  tier: MemberTier
  points: number
  totalSpent: number
  preferences: string[]
  stayCount: number
  lastStay?: string
  nextTierThreshold: number
  progressToNextTier: number
}

const tierThresholds: Record<MemberTier, number> = {
  silver: 0,
  gold: 5000,
  platinum: 20000,
  diamond: 50000,
}

interface MemberState {
  members: Member[]
  selectedMember: Member | null
  loading: boolean
  fetchMembers: () => Promise<void>
  fetchMember: (id: number) => Promise<Member>
  selectMember: (id: number) => void
  updatePreferences: (id: number, prefs: string[]) => Promise<void>
}

const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  selectedMember: null,
  loading: false,

  fetchMembers: async () => {
    set({ loading: true })
    const res = await fetch('/api/members')
    const data = await res.json()
    if (!res.ok || !data.success) {
      set({ loading: false })
      throw new Error(data.error || '获取会员列表失败')
    }
    set({ members: data.data, loading: false })
  },

  fetchMember: async (id: number) => {
    const res = await fetch(`/api/members/${id}`)
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '获取会员详情失败')
    }
    return data.data
  },

  selectMember: (id) => {
    const member = get().members.find((m) => m.id === id) || null
    set({ selectedMember: member })
  },

  updatePreferences: async (id, prefs) => {
    const res = await fetch(`/api/members/${id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '更新偏好失败')
    }
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, preferences: prefs } : m)),
      selectedMember: state.selectedMember?.id === id
        ? { ...state.selectedMember, preferences: prefs }
        : state.selectedMember,
    }))
  },
}))

export default useMemberStore
export { tierThresholds }
