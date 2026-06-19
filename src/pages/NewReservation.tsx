import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import useReservationStore from '@/store/useReservationStore'
import type { RoomType } from '@/store/useRoomStore'

const roomTypeOptions: { label: string; value: RoomType }[] = [
  { label: '标准间', value: 'standard' },
  { label: '豪华间', value: 'deluxe' },
  { label: '套房', value: 'suite' },
  { label: '总统套房', value: 'presidential' },
]
const preferenceOptions = ['高楼层', '低楼层', '无烟', '吸烟', '硬枕', '软枕', '朝南', '远离电梯']

export default function NewReservation() {
  const navigate = useNavigate()
  const { createReservation, autoAssign } = useReservationStore()
  const [form, setForm] = useState({
    guestName: '',
    phone: '',
    roomType: 'standard' as RoomType,
    checkIn: '2026-06-19',
    checkOut: '2026-06-22',
    preferences: [] as string[],
  })
  const [assignResult, setAssignResult] = useState<{ roomId: number; roomNumber: string; matchScore: number; matchDetails: { preference: string; matched: boolean }[] } | null>(null)

  const togglePref = (pref: string) => {
    setForm((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter((p) => p !== pref)
        : [...prev.preferences, pref],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newRes = await createReservation(form)
    const result = await autoAssign(newRes.id)
    setAssignResult(result)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reservations')} className="p-2 text-[#F5F0EB]/40 hover:text-[#C9A96E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-[#C9A96E] font-['Playfair_Display']">新建预订</h2>
      </div>

      <form onSubmit={handleSubmit} className="gradient-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">客人姓名</label>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
              placeholder="请输入姓名"
              className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">联系电话</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入电话"
              className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">房型</label>
          <div className="grid grid-cols-4 gap-3">
            {roomTypeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, roomType: type.value })}
                className={`py-2.5 rounded-lg text-sm border transition-all ${
                  form.roomType === type.value
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/40'
                    : 'bg-[#0D1B2A]/50 text-[#F5F0EB]/50 border-[#C9A96E]/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">入住日期</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">退房日期</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">偏好设置</label>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => togglePref(pref)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  form.preferences.includes(pref)
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/40'
                    : 'bg-[#0D1B2A]/50 text-[#F5F0EB]/40 border-[#C9A96E]/10'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] font-bold rounded-lg hover:shadow-[0_0_20px_rgba(201,169,110,0.4)] transition-all"
        >
          <Save className="w-4 h-4" />
          提交预订
        </button>
      </form>

      {assignResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setAssignResult(null)}>
          <div className="glass-card gold-border-glow p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">智能房态分配结果</h3>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-[#0D1B2A]/50 rounded-lg border border-[#C9A96E]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#F5F0EB]">{assignResult.roomNumber}号房</span>
                  <span className="text-sm font-bold text-[#C9A96E]">{assignResult.matchScore}%匹配</span>
                </div>
                <div className="w-full h-2 bg-[#F5F0EB]/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full" style={{ width: `${assignResult.matchScore}%`, backgroundColor: assignResult.matchScore >= 80 ? '#34D399' : '#F59E0B' }} />
                </div>
                <div className="space-y-1">
                  {assignResult.matchDetails.map((detail, i) => (
                    <div key={i} className="text-xs flex items-center gap-2" style={{ color: detail.matched ? '#34D399' : '#F5F0EB40' }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${detail.matched ? 'bg-[#34D399]' : 'bg-[#F5F0EB]/20'}`} />
                      {detail.preference}
                      {detail.matched ? ' ✓' : ' ✗'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => { setAssignResult(null); navigate('/reservations') }} className="w-full py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium">
              确认并返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
