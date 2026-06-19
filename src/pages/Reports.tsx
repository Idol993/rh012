import { useEffect, useState } from 'react'
import { Download, Calendar } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import useDashboardStore from '@/store/useDashboardStore'

export default function Reports() {
  const { nightAuditData, fetchNightAudit, exportReport } = useDashboardStore()
  const [dateRange, setDateRange] = useState({ from: '2026-06-13', to: '2026-06-19' })
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    fetchNightAudit()
  }, [fetchNightAudit])

  const chartOption = {
    grid: { top: 40, right: 20, bottom: 30, left: 60 },
    legend: { top: 0, textStyle: { color: '#F5F0EB60', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: nightAuditData.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#C9A96E20' } },
      axisLabel: { color: '#F5F0EB60', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#C9A96E10' } },
      axisLabel: { color: '#F5F0EB40', fontSize: 11, formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
    },
    series: [
      {
        name: '客房收入',
        type: 'bar',
        stack: 'revenue',
        data: nightAuditData.map((d) => d.roomRevenue),
        itemStyle: { color: '#C9A96E', borderRadius: [0, 0, 0, 0] },
        barWidth: 24,
      },
      {
        name: '餐饮收入',
        type: 'bar',
        stack: 'revenue',
        data: nightAuditData.map((d) => d.fbRevenue),
        itemStyle: { color: '#3B82F6', borderRadius: [0, 0, 0, 0] },
        barWidth: 24,
      },
      {
        name: '其他收入',
        type: 'bar',
        stack: 'revenue',
        data: nightAuditData.map((d) => d.otherRevenue),
        itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] },
        barWidth: 24,
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1B2A4A',
      borderColor: '#C9A96E40',
      textStyle: { color: '#F5F0EB', fontSize: 12 },
      formatter: (params: any[]) => {
        let total = 0
        const rows = params.map((p: any) => {
          total += p.value
          return `<div style="display:flex;justify-content:space-between;gap:16px"><span>${p.seriesName}</span><span>¥${p.value.toLocaleString()}</span></div>`
        }).join('')
        return `<div style="font-weight:bold;margin-bottom:4px">${params[0].axisValue}</div>${rows}<div style="border-top:1px solid #C9A96E30;margin-top:4px;padding-top:4px;display:flex;justify-content:space-between"><span>合计</span><span>¥${total.toLocaleString()}</span></div>`
      },
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="gradient-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-4 h-4 text-[#C9A96E]" />
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-1.5 text-sm text-[#F5F0EB]" />
            <span className="text-[#F5F0EB]/30">至</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-1.5 text-sm text-[#F5F0EB]" />
          </div>
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" />导出报表
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 bg-[#1B2A4A] border border-[#C9A96E]/20 rounded-lg overflow-hidden shadow-xl z-10">
                <button onClick={() => { exportReport('pdf'); setShowExport(false) }} className="w-full px-6 py-2.5 text-sm text-[#F5F0EB] hover:bg-[#C9A96E]/10 text-left transition-colors">导出 PDF</button>
                <button onClick={() => { exportReport('excel'); setShowExport(false) }} className="w-full px-6 py-2.5 text-sm text-[#F5F0EB] hover:bg-[#C9A96E]/10 text-left transition-colors">导出 Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="gradient-border p-6">
        <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">收入分析</h3>
        <ReactECharts option={chartOption} style={{ height: '300px' }} />
      </div>

      <div className="gradient-border overflow-hidden">
        <div className="p-4 border-b border-[#C9A96E]/10">
          <h3 className="text-lg font-bold text-[#C9A96E] font-['Playfair_Display']">夜审报表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#C9A96E]/10">
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">日期</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">入住率</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">客房收入</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">餐饮收入</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">RevPAR</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">ADR</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">入住/退房</th>
              </tr>
            </thead>
            <tbody>
              {nightAuditData.map((row, i) => (
                <tr key={i} className="border-b border-[#C9A96E]/5 hover:bg-[#C9A96E]/5 transition-colors">
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]">{row.date}</td>
                  <td className="py-3 px-4 text-sm text-[#C9A96E]">{row.occupancy}%</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{row.roomRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{row.fbRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{row.revPAR}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{row.adr}</td>
                  <td className="py-3 px-4 text-sm text-[#34D399]">{row.checkIns}<span className="text-[#F5F0EB]/30"> / </span><span className="text-[#3B82F6]">{row.checkOuts}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
