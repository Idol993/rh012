import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { TrendingUp, TrendingDown, Zap, Star, Download, RefreshCw } from 'lucide-react'
import useDashboardStore from '@/store/useDashboardStore'
import useServiceStore from '@/store/useServiceStore'
import type { ServiceType, Priority } from '@/store/useServiceStore'

const serviceTypeLabels: Record<ServiceType, string> = {
  water: '送水',
  towel: '毛巾',
  cleaning: '清洁',
  maintenance: '维修',
  other: '其他',
}

const servicePriorityColors: Record<Priority, string> = {
  low: '#34D399', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444',
}

const servicePriorityLabels: Record<Priority, string> = {
  low: '低', medium: '中', high: '高', urgent: '紧急',
}

const statusFilters: { key: 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'assigned', label: '已派单' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

export default function GMDashboard() {
  const { dashboardData, loading, fetchDashboardData, exportReport } = useDashboardStore()
  const { fetchRequests } = useServiceStore()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [serviceFilter, setServiceFilter] = useState<'all' | 'pending' | 'assigned' | 'in_progress' | 'completed'>('all')

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchDashboardData(), fetchRequests()])
      setLastRefresh(new Date())
    } catch (err: any) {
      alert(err.message || '刷新失败')
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    const timer = setInterval(handleRefresh, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleExport = async () => {
    try {
      await exportReport('night_audit', 'pdf')
    } catch (err: any) {
      alert(err.message || '导出失败')
    }
  }

  if (!dashboardData) return null

  const data = dashboardData
  const occChange = data.occupancy.current - data.occupancy.yesterday
  const revparChange = data.revpar.current - data.revpar.yesterday
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const occupancyChartOption = {
    backgroundColor: 'transparent',
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#4a5568' } }, axisLabel: { color: '#a0aec0' } },
    yAxis: { type: 'value', max: 100, axisLine: { show: false }, splitLine: { lineStyle: { color: '#2d3748' } }, axisLabel: { color: '#a0aec0', formatter: '{value}%' } },
    series: [{
      type: 'line', data: data.occupancy.trend, smooth: true,
      lineStyle: { color: '#C9A96E', width: 3 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(201,169,110,0.3)' }, { offset: 1, color: 'rgba(201,169,110,0)' }] } },
      itemStyle: { color: '#C9A96E' },
      symbol: 'circle', symbolSize: 8,
    }],
    tooltip: { trigger: 'axis', backgroundColor: '#1B2A4A', borderColor: '#C9A96E', textStyle: { color: '#F5F0EB' }, formatter: '{b}: {c}%' },
  }

  const revparChartOption = {
    backgroundColor: 'transparent',
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#4a5568' } }, axisLabel: { color: '#a0aec0' } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#2d3748' } }, axisLabel: { color: '#a0aec0', formatter: '¥{value}' } },
    series: [{
      type: 'line', data: data.revpar.trend, smooth: true,
      lineStyle: { color: '#34D399', width: 3 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52,211,153,0.3)' }, { offset: 1, color: 'rgba(52,211,153,0)' }] } },
      itemStyle: { color: '#34D399' },
      symbol: 'circle', symbolSize: 8,
    }],
    tooltip: { trigger: 'axis', backgroundColor: '#1B2A4A', borderColor: '#34D399', textStyle: { color: '#F5F0EB' }, formatter: '{b}: ¥{value}' },
  }

  const energyChartOption = {
    backgroundColor: 'transparent',
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: data.energy.byFloor.map(f => `${f.floor}F`), axisLine: { lineStyle: { color: '#4a5568' } }, axisLabel: { color: '#a0aec0' } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#2d3748' } }, axisLabel: { color: '#a0aec0' } },
    series: [{
      type: 'bar', data: data.energy.byFloor.map(f => f.consumption),
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const colors = ['#4a6fa5', '#4a7fb5', '#4a8fc5', '#4a9fd5', '#5aafe5', '#6abff5', '#F6AD55', '#EF4444']
          return colors[params.dataIndex] || '#C9A96E'
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '50%',
    }],
    tooltip: { trigger: 'axis', backgroundColor: '#1B2A4A', borderColor: '#C9A96E', textStyle: { color: '#F5F0EB' }, formatter: '{b}: {c} kWh' },
  }

  const revenueChartOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '50%'],
      data: [
        { value: data.revenue.roomRevenue, name: '客房收入', itemStyle: { color: '#C9A96E' } },
        { value: data.revenue.minibarRevenue, name: '迷你吧', itemStyle: { color: '#34D399' } },
        { value: data.revenue.serviceRevenue, name: '服务收入', itemStyle: { color: '#6366F1' } },
      ],
      label: { color: '#F5F0EB', fontSize: 12 },
      labelLine: { lineStyle: { color: '#4a5568' } },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
    tooltip: { backgroundColor: '#1B2A4A', borderColor: '#C9A96E', textStyle: { color: '#F5F0EB' }, formatter: '{b}: ¥{c} ({d}%)' },
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F0EB]" style={{ fontFamily: 'Playfair Display, serif' }}>
            总经理经营大屏
          </h1>
          <p className="text-sm text-[#8B9DC3] mt-1">
            实时数据监控 · 最后刷新 {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] border border-[#C9A96E]/30 text-[#C9A96E] rounded-lg hover:bg-[#C9A96E]/10 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#B8924F] text-[#0D1B2A] font-semibold rounded-lg hover:from-[#B8924F] hover:to-[#A07D3A] transition-all"
          >
            <Download size={16} />
            导出夜审报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0D1B2A] border border-[#C9A96E]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B9DC3]">入住率</span>
            <div className={`flex items-center gap-1 text-xs ${occChange >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
              {occChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(occChange)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-[#C9A96E]" style={{ fontFamily: 'Playfair Display, serif' }}>
            {data.occupancy.current}%
          </div>
          <div className="mt-2 h-1.5 bg-[#0D1B2A] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] rounded-full transition-all duration-1000" style={{ width: `${data.occupancy.current}%` }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0D1B2A] border border-[#34D399]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B9DC3]">RevPAR</span>
            <div className={`flex items-center gap-1 text-xs ${revparChange >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
              {revparChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              ¥{Math.abs(revparChange)}
            </div>
          </div>
          <div className="text-3xl font-bold text-[#34D399]" style={{ fontFamily: 'Playfair Display, serif' }}>
            ¥{data.revpar.current}
          </div>
          <p className="text-xs text-[#8B9DC3] mt-2">ADR: ¥{data.revpar.adr}</p>
        </div>

        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0D1B2A] border border-[#F6AD55]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B9DC3]">网评得分</span>
            <Star size={16} className="text-[#F6AD55]" />
          </div>
          <div className="text-3xl font-bold text-[#F6AD55]" style={{ fontFamily: 'Playfair Display, serif' }}>
            {data.reviews.average}
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={i < Math.floor(data.reviews.average) ? 'text-[#F6AD55] fill-[#F6AD55]' : 'text-[#4a5568]'} />
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1B2A4A] to-[#0D1B2A] border border-[#6366F1]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B9DC3]">总能耗</span>
            <Zap size={16} className="text-[#6366F1]" />
          </div>
          <div className="text-3xl font-bold text-[#6366F1]" style={{ fontFamily: 'Playfair Display, serif' }}>
            {data.energy.total}
          </div>
          <p className="text-xs text-[#8B9DC3] mt-2">kWh</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#1B2A4A]/80 border border-[#C9A96E]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#C9A96E] mb-4">入住率趋势</h3>
          <ReactECharts option={occupancyChartOption} style={{ height: '220px' }} />
        </div>

        <div className="bg-[#1B2A4A]/80 border border-[#34D399]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#34D399] mb-4">RevPAR趋势</h3>
          <ReactECharts option={revparChartOption} style={{ height: '220px' }} />
        </div>

        <div className="bg-[#1B2A4A]/80 border border-[#6366F1]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#6366F1] mb-4">收入构成</h3>
          <ReactECharts option={revenueChartOption} style={{ height: '220px' }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1B2A4A]/80 border border-[#F6AD55]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F6AD55] mb-4">各平台评分</h3>
          <div className="space-y-3">
            {data.reviews.platforms.map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-sm text-[#F5F0EB] w-10">{p.name}</span>
                <div className="flex-1 h-2 bg-[#0D1B2A] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F6AD55] to-[#C9A96E] rounded-full" style={{ width: `${(p.score / 5) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-[#F6AD55] w-8">{p.score}</span>
                <span className="text-xs text-[#8B9DC3]">({p.count})</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#2d3748]">
            <h4 className="text-xs text-[#8B9DC3] mb-2">评论关键词</h4>
            <div className="flex flex-wrap gap-2">
              {data.reviews.keywords.map(k => (
                <span
                  key={k.word}
                  className={`px-2 py-0.5 rounded text-xs ${k.weight > 50 ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}
                >
                  {k.word}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1B2A4A]/80 border border-[#6366F1]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#6366F1] mb-4">楼层能耗分布</h3>
          <ReactECharts option={energyChartOption} style={{ height: '200px' }} />
          <div className="mt-3 space-y-2">
            {data.energy.alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded ${a.level === 'warning' ? 'bg-[#F6AD55]/10 text-[#F6AD55]' : 'bg-[#34D399]/10 text-[#34D399]'}`}>
                <Zap size={12} />
                {a.message}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1B2A4A]/80 border border-[#C9A96E]/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#C9A96E] mb-4">收入明细</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#C9A96E]" />
                <span className="text-sm text-[#F5F0EB]">客房收入</span>
              </div>
              <span className="text-lg font-bold text-[#C9A96E]" style={{ fontFamily: 'Playfair Display, serif' }}>
                ¥{data.revenue.roomRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#34D399]" />
                <span className="text-sm text-[#F5F0EB]">迷你吧</span>
              </div>
              <span className="text-lg font-bold text-[#34D399]" style={{ fontFamily: 'Playfair Display, serif' }}>
                ¥{data.revenue.minibarRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6366F1]" />
                <span className="text-sm text-[#F5F0EB]">服务收入</span>
              </div>
              <span className="text-lg font-bold text-[#6366F1]" style={{ fontFamily: 'Playfair Display, serif' }}>
                ¥{data.revenue.serviceRevenue.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-[#2d3748] pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F0EB]">总收入</span>
              <span className="text-2xl font-bold text-[#C9A96E]" style={{ fontFamily: 'Playfair Display, serif' }}>
                ¥{data.revenue.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-[#1B2A4A]/80 border border-[#C9A96E]/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#C9A96E]">住中服务监控</h3>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {statusFilters.map((f) => {
            const count = f.key === 'all'
              ? data.serviceRequests.summary.pending + data.serviceRequests.summary.assigned + data.serviceRequests.summary.in_progress + data.serviceRequests.summary.completed
              : data.serviceRequests.summary[f.key]
            return (
              <button
                key={f.key}
                onClick={() => setServiceFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  serviceFilter === f.key
                    ? 'bg-[#C9A96E]/20 border border-[#C9A96E] text-[#C9A96E]'
                    : 'bg-[#0D1B2A]/50 border border-[#4a5568]/30 text-[#8B9DC3] hover:border-[#C9A96E]/30'
                }`}
              >
                {f.label} {count}
              </button>
            )
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d3748]">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">房号</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">服务类型</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">负责人</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">优先级</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">创建时间</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#8B9DC3]">完成时间</th>
              </tr>
            </thead>
            <tbody>
              {data.serviceRequests.items
                .filter((item) => serviceFilter === 'all' || item.status === serviceFilter)
                .map((item) => (
                  <tr key={item.id} className="border-b border-[#2d3748]/50 hover:bg-[#0D1B2A]/30">
                    <td className="py-2.5 px-3 text-[#F5F0EB] font-medium">{item.roomNumber}</td>
                    <td className="py-2.5 px-3 text-[#F5F0EB]">
                      {serviceTypeLabels[item.type as ServiceType] || item.type}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.assignedTo ? (
                        <span className="text-[#F5F0EB]">{item.assignedTo.name}</span>
                      ) : (
                        <span className="text-[#8B9DC3]">未派单</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          color: servicePriorityColors[item.priority as Priority],
                          backgroundColor: servicePriorityColors[item.priority as Priority] + '20',
                        }}
                      >
                        {servicePriorityLabels[item.priority as Priority]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#8B9DC3]">{item.createdAt.substring(11, 16)}</td>
                    <td className="py-2.5 px-3 text-[#8B9DC3]">{item.completedAt ? item.completedAt.substring(11, 16) : '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
