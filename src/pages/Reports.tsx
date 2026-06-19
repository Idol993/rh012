import { useEffect, useState } from 'react'
import { Download, Calendar } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import useDashboardStore from '@/store/useDashboardStore'

export default function Reports() {
  const { nightAuditReport, fetchNightAudit, fetchDashboardData, dashboardData, exportReport } = useDashboardStore()
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    fetchNightAudit()
    fetchDashboardData()
  }, [fetchNightAudit, fetchDashboardData])

  const revenueChartOption = {
    grid: { top: 40, right: 20, bottom: 30, left: 60 },
    legend: { top: 0, textStyle: { color: '#F5F0EB60', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: nightAuditReport ? [nightAuditReport.date.slice(5)] : [],
      axisLine: { lineStyle: { color: '#C9A96E20' } },
      axisLabel: { color: '#F5F0EB60', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#C9A96E10' } },
      axisLabel: { color: '#F5F0EB40', fontSize: 11, formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` },
    },
    series: nightAuditReport ? [
      {
        name: '客房收入',
        type: 'bar',
        stack: 'revenue',
        data: [nightAuditReport.roomRevenue],
        itemStyle: { color: '#C9A96E', borderRadius: [0, 0, 0, 0] },
        barWidth: 40,
      },
      {
        name: '迷你吧收入',
        type: 'bar',
        stack: 'revenue',
        data: [nightAuditReport.minibarRevenue],
        itemStyle: { color: '#3B82F6', borderRadius: [0, 0, 0, 0] },
        barWidth: 40,
      },
      {
        name: '其他收入',
        type: 'bar',
        stack: 'revenue',
        data: [nightAuditReport.otherRevenue],
        itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] },
        barWidth: 40,
      },
    ] : [],
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
            <span className="text-sm text-[#F5F0EB]/70">夜审日期：{nightAuditReport?.date || '加载中...'}</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" />导出报表
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 bg-[#1B2A4A] border border-[#C9A96E]/20 rounded-lg overflow-hidden shadow-xl z-10">
                <button onClick={() => { exportReport('night_audit', 'pdf'); setShowExport(false) }} className="w-full px-6 py-2.5 text-sm text-[#F5F0EB] hover:bg-[#C9A96E]/10 text-left transition-colors">导出 PDF</button>
                <button onClick={() => { exportReport('night_audit', 'excel'); setShowExport(false) }} className="w-full px-6 py-2.5 text-sm text-[#F5F0EB] hover:bg-[#C9A96E]/10 text-left transition-colors">导出 Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="gradient-border p-6">
        <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">收入分析</h3>
        <ReactECharts option={revenueChartOption} style={{ height: '300px' }} />
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
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">迷你吧收入</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">其他收入</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">总收入</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">RevPAR</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">ADR</th>
                <th className="text-left py-3 px-4 text-xs text-[#C9A96E] font-medium">入住/退房</th>
              </tr>
            </thead>
            <tbody>
              {nightAuditReport ? (
                <tr className="border-b border-[#C9A96E]/5 hover:bg-[#C9A96E]/5 transition-colors">
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]">{nightAuditReport.date}</td>
                  <td className="py-3 px-4 text-sm text-[#C9A96E]">{nightAuditReport.occupancy}%</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{nightAuditReport.roomRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{nightAuditReport.minibarRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{nightAuditReport.otherRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#C9A96E] font-medium">¥{nightAuditReport.totalRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{nightAuditReport.revpar}</td>
                  <td className="py-3 px-4 text-sm text-[#F5F0EB]/80">¥{nightAuditReport.adr}</td>
                  <td className="py-3 px-4 text-sm text-[#34D399]">{nightAuditReport.checkIns}<span className="text-[#F5F0EB]/30"> / </span><span className="text-[#3B82F6]">{nightAuditReport.checkOuts}</span></td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#F5F0EB]/40">加载中...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dashboardData && (
        <div className="grid grid-cols-2 gap-6">
          <div className="gradient-border p-6">
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">入住率趋势</h3>
            <ReactECharts
              option={{
                grid: { top: 20, right: 20, bottom: 30, left: 40 },
                xAxis: { type: 'category', data: dashboardData.occupancy.trend.map((_, i) => `Day ${i + 1}`), axisLine: { lineStyle: { color: '#C9A96E20' } }, axisLabel: { color: '#F5F0EB60', fontSize: 10 } },
                yAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#C9A96E10' } }, axisLabel: { color: '#F5F0EB40', fontSize: 10, formatter: '{value}%' } },
                series: [{ type: 'line', data: dashboardData.occupancy.trend, smooth: true, lineStyle: { color: '#C9A96E', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#C9A96E40' }, { offset: 1, color: '#C9A96E05' }] } }, itemStyle: { color: '#C9A96E' }, symbol: 'circle', symbolSize: 4 }],
              }}
              style={{ height: '200px' }}
            />
          </div>
          <div className="gradient-border p-6">
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">RevPAR 趋势</h3>
            <ReactECharts
              option={{
                grid: { top: 20, right: 20, bottom: 30, left: 40 },
                xAxis: { type: 'category', data: dashboardData.revpar.trend.map((_, i) => `Day ${i + 1}`), axisLine: { lineStyle: { color: '#C9A96E20' } }, axisLabel: { color: '#F5F0EB60', fontSize: 10 } },
                yAxis: { type: 'value', splitLine: { lineStyle: { color: '#C9A96E10' } }, axisLabel: { color: '#F5F0EB40', fontSize: 10, formatter: '¥{value}' } },
                series: [{ type: 'line', data: dashboardData.revpar.trend, smooth: true, lineStyle: { color: '#34D399', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#34D39940' }, { offset: 1, color: '#34D39905' }] } }, itemStyle: { color: '#34D399' }, symbol: 'circle', symbolSize: 4 }],
              }}
              style={{ height: '200px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
