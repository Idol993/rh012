import { create } from 'zustand'

export type MemberTier = 'silver' | 'gold' | 'platinum' | 'diamond'

export interface Member {
  id: string
  name: string
  phone: string
  tier: MemberTier
  points: number
  totalSpent: number
  stayCount: number
  preferences: string[]
  joinDate: string
  lastStay: string
  spendingTrend: { month: string; amount: number }[]
}

interface MemberState {
  members: Member[]
  selectedMember: Member | null
  loading: boolean
  fetchMembers: () => Promise<void>
  selectMember: (id: string) => void
  updatePreferences: (id: string, prefs: string[]) => Promise<void>
}

const tierThresholds: Record<MemberTier, number> = { silver: 0, gold: 5000, platinum: 20000, diamond: 50000 }

const generateMembers = (): Member[] => {
  const names = ['张伟', '李娜', '王芳', '刘洋', '陈明', '赵雪', '孙鹏', '周丽', '吴强', '郑慧', '黄磊', '林涛', '何敏', '高峰', '马丽']
  const tiers: MemberTier[] = ['silver', 'silver', 'gold', 'gold', 'platinum', 'diamond']
  const prefs = ['高楼层', '无烟', '硬枕', '低楼层', '软枕', '朝南', '安静', '远离电梯']
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  return names.map((name, i) => {
    const tier = tiers[i % tiers.length]
    const points = tierThresholds[tier] + Math.floor(Math.random() * 10000)
    return {
      id: `MEM-${String(100 + i)}`,
      name,
      phone: `138${String(10000000 + i * 765432).slice(0, 8)}`,
      tier,
      points,
      totalSpent: points * 2 + Math.floor(Math.random() * 5000),
      stayCount: 5 + Math.floor(Math.random() * 30),
      preferences: [prefs[i % prefs.length], prefs[(i + 3) % prefs.length]],
      joinDate: '2024-01-15',
      lastStay: '2026-06-10',
      spendingTrend: months.map((m, mi) => ({
        month: m,
        amount: 2000 + Math.floor(Math.random() * 5000) + mi * 200,
      })),
    }
  })
}

const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  selectedMember: null,
  loading: false,

  fetchMembers: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error()
      const data = await res.json()
      set({ members: data, loading: false })
    } catch {
      set({ members: generateMembers(), loading: false })
    }
  },

  selectMember: (id) => {
    const member = get().members.find((m) => m.id === id) || null
    set({ selectedMember: member })
  },

  updatePreferences: async (id, prefs) => {
    try {
      await fetch(`/api/members/${id}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      })
    } catch {}
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, preferences: prefs } : m)),
      selectedMember: state.selectedMember?.id === id ? { ...state.selectedMember, preferences: prefs } : state.selectedMember,
    }))
  },
}))

export default useMemberStore
export { tierThresholds }
