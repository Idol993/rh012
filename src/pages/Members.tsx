import { useEffect, useState } from 'react'
import { Search, X, Crown } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import useMemberStore, { tierThresholds } from '@/store/useMemberStore'
import type { MemberTier } from '@/store/useMemberStore'

const tierColors: Record<MemberTier, string> = {
  silver: '#94A3B8', gold: '#C9A96E', platinum: '#8B5CF6', diamond: '#06B6D4',
}

const tierLabels: Record<MemberTier, string> = {
  silver: '银卡', gold: '金卡', platinum: '白金卡', diamond: '钻石卡',
}

const tierOrder: MemberTier[] = ['silver', 'gold', 'platinum', 'diamond']

export default function Members() {
  const { members, selectedMember, fetchMembers, selectMember, updatePreferences } = useMemberStore()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const filtered = members.filter((m) => {
    if (tierFilter !== 'all' && m.tier !== tierFilter) return false
    if (search && !m.name.includes(search) && !m.phone.includes(search)) return false
    return true
  })

  const getNextTier = (tier: MemberTier): MemberTier | null => {
    const idx = tierOrder.indexOf(tier)
    return idx < tierOrder.length - 1 ? tierOrder[idx + 1] : null
  }

  const getUpgradeProgress = (tier: MemberTier, points: number) => {
    const next = getNextTier(tier)
    if (!next) return 100
    const currentThreshold = tierThresholds[tier]
    const nextThreshold = tierThresholds[next]
    return Math.min(100, Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
  }

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="gradient-border p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EB]/30" />
              <input type="text" placeholder="搜索会员姓名或手机号..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25" />
            </div>
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-2 text-sm text-[#F5F0EB]">
              <option value="all">全部等级</option>
              {tierOrder.map((t) => <option key={t} value={t}>{tierLabels[t]}</option>)}
            </select>
          </div>
        </div>

        <div className="gradient-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#C9A96E]/10">
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">姓名</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">手机</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">等级</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">积分</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">入住次数</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} onClick={() => selectMember(m.id)} className="border-b border-[#C9A96E]/5 hover:bg-[#C9A96E]/5 cursor-pointer transition-colors">
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]">{m.name}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/70">{m.phone}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ color: tierColors[m.tier], backgroundColor: tierColors[m.tier] + '20' }}>
                      <Crown className="w-3 h-3" />{tierLabels[m.tier]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#C9A96E]">{m.points.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/70">{m.stayCount}次</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedMember && (
        <div className="w-96 flex-shrink-0 animate-slide-in-right">
          <div className="gradient-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#C9A96E] font-['Playfair_Display']">会员详情</h3>
              <button onClick={() => selectMember(selectedMember.id)} className="p-1 text-[#F5F0EB]/40 hover:text-[#F5F0EB]"><X className="w-4 h-4" /></button>
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: tierColors[selectedMember.tier] + '20' }}>
                <Crown className="w-8 h-8" style={{ color: tierColors[selectedMember.tier] }} />
              </div>
              <h4 className="text-xl font-bold text-[#F5F0EB]">{selectedMember.name}</h4>
              <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full" style={{ color: tierColors[selectedMember.tier], backgroundColor: tierColors[selectedMember.tier] + '20' }}>
                {tierLabels[selectedMember.tier]}会员
              </span>
            </div>

            <div>
              <p className="text-xs text-[#F5F0EB]/50 mb-2">偏好</p>
              <div className="flex flex-wrap gap-2">
                {selectedMember.preferences.map((p, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-xs">{p}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#F5F0EB]/50">升级进度</span>
                <span className="text-xs text-[#C9A96E]">
                  {selectedMember.points.toLocaleString()} / {(tierThresholds[getNextTier(selectedMember.tier) || 'diamond'] || tierThresholds.diamond).toLocaleString()} 积分
                </span>
              </div>
              <div className="w-full h-2 bg-[#F5F0EB]/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${getUpgradeProgress(selectedMember.tier, selectedMember.points)}%`, backgroundColor: tierColors[selectedMember.tier] }} />
              </div>
              <p className="text-xs text-[#F5F0EB]/30 mt-1">
                {getNextTier(selectedMember.tier) ? `距离${tierLabels[getNextTier(selectedMember.tier)!]}还需${(tierThresholds[getNextTier(selectedMember.tier)!] - selectedMember.points).toLocaleString()}积分` : '已达到最高等级'}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#F5F0EB]/50 mb-2">消费趋势</p>
              <ReactECharts
                option={{
                  grid: { top: 10, right: 10, bottom: 20, left: 40 },
                  xAxis: { type: 'category', data: selectedMember.spendingTrend.map((s) => s.month), axisLine: { lineStyle: { color: '#C9A96E20' } }, axisLabel: { color: '#F5F0EB60', fontSize: 10 } },
                  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#C9A96E10' } }, axisLabel: { color: '#F5F0EB40', fontSize: 10 } },
                  series: [{ type: 'line', data: selectedMember.spendingTrend.map((s) => s.amount), smooth: true, lineStyle: { color: '#C9A96E', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#C9A96E40' }, { offset: 1, color: '#C9A96E05' }] } }, itemStyle: { color: '#C9A96E' }, symbol: 'circle', symbolSize: 4 }],
                  tooltip: { trigger: 'axis', backgroundColor: '#1B2A4A', borderColor: '#C9A96E40', textStyle: { color: '#F5F0EB', fontSize: 12 } },
                }}
                style={{ height: '160px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#0D1B2A]/50 rounded-lg">
                <p className="text-lg font-bold text-[#C9A96E]">{selectedMember.stayCount}</p>
                <p className="text-xs text-[#F5F0EB]/40">入住次数</p>
              </div>
              <div className="p-3 bg-[#0D1B2A]/50 rounded-lg">
                <p className="text-lg font-bold text-[#C9A96E]">¥{selectedMember.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-[#F5F0EB]/40">累计消费</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
