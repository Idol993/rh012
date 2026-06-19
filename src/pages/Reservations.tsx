import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Wand2, Eye } from 'lucide-react'
import useReservationStore from '@/store/useReservationStore'
import StatusBadge from '@/components/StatusBadge'

export default function Reservations() {
  const navigate = useNavigate()
  const { reservations, fetchReservations, autoAssign } = useReservationStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignModal, setAssignModal] = useState<{ id: string; results: { roomId: string; matchScore: number }[]; prefs: string[] } | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search && !r.guestName.includes(search) && !r.id.includes(search)) return false
    return true
  })

  const handleAutoAssign = async (id: string) => {
    const res = await useReservationStore.getState().autoAssign(id)
    const resItem = reservations.find((r) => r.id === id)
    setAssignModal({ id, results: res, prefs: resItem?.preferences || [] })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="gradient-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EB]/30" />
              <input
                type="text"
                placeholder="搜索客人姓名或预订号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-2 text-sm text-[#F5F0EB]"
            >
              <option value="all">全部状态</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="checked_in">已入住</option>
              <option value="checked_out">已退房</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/reservations/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium hover:shadow-[0_0_15px_rgba(201,169,110,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            新建预订
          </button>
        </div>
      </div>

      <div className="gradient-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#C9A96E]/10">
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">预订号</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">客人</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">入住</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">退房</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">房型</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">状态</th>
              <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((res) => (
              <tr key={res.id} className="border-b border-[#C9A96E]/5 hover:bg-[#C9A96E]/5 transition-colors">
                <td className="py-3 px-4 text-sm text-[#F5F0EB]">{res.id}</td>
                <td className="py-3 px-4 text-sm text-[#F5F0EB]">{res.guestName}</td>
                <td className="py-3 px-4 text-sm text-[#F5F0EB]/70">{res.checkIn}</td>
                <td className="py-3 px-4 text-sm text-[#F5F0EB]/70">{res.checkOut}</td>
                <td className="py-3 px-4 text-sm text-[#F5F0EB]/70">{res.roomType}</td>
                <td className="py-3 px-4"><StatusBadge status={res.status} type="reservation" /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-[#F5F0EB]/40 hover:text-[#C9A96E] transition-colors"><Eye className="w-4 h-4" /></button>
                    {res.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleAutoAssign(res.id)}
                          className="p-1.5 text-[#F5F0EB]/40 hover:text-[#3B82F6] transition-colors"
                          title="智能分配"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setAssignModal(null)}>
          <div className="glass-card gold-border-glow p-6 w-[480px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">智能房态分配</h3>
            <div className="mb-4">
              <p className="text-xs text-[#F5F0EB]/50 mb-2">客人偏好</p>
              <div className="flex gap-2">
                {assignModal.prefs.map((p, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-xs">{p}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-[#F5F0EB]/50">推荐房间</p>
              {assignModal.results.map((r, i) => (
                <div key={i} className="p-3 bg-[#0D1B2A]/50 rounded-lg border border-[#C9A96E]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#F5F0EB]">{r.roomId.replace('room-', '')}号房</span>
                    <span className="text-sm font-bold text-[#C9A96E]">{r.matchScore}%匹配</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5F0EB]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.matchScore}%`, backgroundColor: r.matchScore >= 80 ? '#34D399' : r.matchScore >= 60 ? '#F59E0B' : '#EF4444' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAssignModal(null)}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium"
            >
              确认分配
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
