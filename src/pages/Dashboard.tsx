import { useEffect } from 'react'
import { BedDouble, LogIn, LogOut, DollarSign, Bell, Sparkles, Users, TrendingUp } from 'lucide-react'
import useAuthStore from '@/store/useAuthStore'
import useDashboardStore from '@/store/useDashboardStore'
import KPICard from '@/components/KPICard'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { dashboardData, fetchDashboardData } = useDashboardStore()
  const role = user?.role || 'staff'

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const kpiSets = {
    staff: [
      { title: '待处理请求', value: dashboardData?.pendingServices || 6, icon: <Bell className="w-5 h-5" />, color: '#EF4444' },
      { title: '今日任务', value: 8, icon: <Sparkles className="w-5 h-5" />, color: '#3B82F6' },
      { title: '已完成', value: 12, icon: <TrendingUp className="w-5 h-5" />, color: '#34D399' },
      { title: '服务评分', value: 96, icon: <Users className="w-5 h-5" />, color: '#C9A96E', suffix: '分' },
    ],
    front_desk: [
      { title: '今日入住', value: dashboardData?.todayCheckIns || 12, icon: <LogIn className="w-5 h-5" />, color: '#34D399', change: 15 },
      { title: '今日退房', value: dashboardData?.todayCheckOuts || 8, icon: <LogOut className="w-5 h-5" />, color: '#3B82F6' },
      { title: '可用客房', value: dashboardData?.availableRooms || 17, icon: <BedDouble className="w-5 h-5" />, color: '#C9A96E' },
      { title: '今日收入', value: dashboardData?.revenue || 128500, icon: <DollarSign className="w-5 h-5" />, color: '#F59E0B', prefix: '¥' },
    ],
    housekeeping_supervisor: [
      { title: '待清洁', value: 8, icon: <Sparkles className="w-5 h-5" />, color: '#F59E0B' },
      { title: '清洁中', value: 4, icon: <BedDouble className="w-5 h-5" />, color: '#3B82F6' },
      { title: '已完成', value: 15, icon: <TrendingUp className="w-5 h-5" />, color: '#34D399' },
      { title: '质量评分', value: 94, icon: <Users className="w-5 h-5" />, color: '#C9A96E', suffix: '分' },
    ],
    gm: [
      { title: '入住率', value: dashboardData?.occupancyRate || 78, icon: <BedDouble className="w-5 h-5" />, color: '#C9A96E', suffix: '%', change: 5 },
      { title: '今日收入', value: dashboardData?.revenue || 128500, icon: <DollarSign className="w-5 h-5" />, color: '#34D399', prefix: '¥', change: 12 },
      { title: '平均房价', value: dashboardData?.avgRoomRate || 680, icon: <TrendingUp className="w-5 h-5" />, color: '#3B82F6', prefix: '¥' },
      { title: '待处理服务', value: dashboardData?.pendingServices || 6, icon: <Bell className="w-5 h-5" />, color: '#EF4444' },
    ],
  }

  const kpis = kpiSets[role] || kpiSets.front_desk

  const quickActions = {
    staff: [
      { label: '接单', color: 'bg-[#34D399]/20 text-[#34D399]' },
      { label: '完成服务', color: 'bg-[#3B82F6]/20 text-[#3B82F6]' },
    ],
    front_desk: [
      { label: '办理入住', color: 'bg-[#34D399]/20 text-[#34D399]' },
      { label: '办理退房', color: 'bg-[#3B82F6]/20 text-[#3B82F6]' },
      { label: '新建预订', color: 'bg-[#C9A96E]/20 text-[#C9A96E]' },
      { label: '服务请求', color: 'bg-[#F59E0B]/20 text-[#F59E0B]' },
    ],
    housekeeping_supervisor: [
      { label: '分配任务', color: 'bg-[#3B82F6]/20 text-[#3B82F6]' },
      { label: '扫描清洁', color: 'bg-[#34D399]/20 text-[#34D399]' },
    ],
    gm: [
      { label: '查看报表', color: 'bg-[#C9A96E]/20 text-[#C9A96E]' },
      { label: '夜审数据', color: 'bg-[#8B5CF6]/20 text-[#8B5CF6]' },
    ],
  }

  const alerts = [
    { text: '301号房空调温度异常', time: '5分钟前', type: 'warning' },
    { text: 'VIP客人张伟已入住502号房', time: '15分钟前', type: 'info' },
    { text: '3楼走廊清洁已完成', time: '30分钟前', type: 'success' },
    { text: '701号房迷你吧需补充', time: '1小时前', type: 'warning' },
  ]

  const alertColors: Record<string, string> = { warning: 'border-l-[#F59E0B]', info: 'border-l-[#3B82F6]', success: 'border-l-[#34D399]' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={i} title={kpi.title} value={kpi.value} change={kpi.change} icon={kpi.icon} color={kpi.color} prefix={kpi.prefix} suffix={kpi.suffix} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="gradient-border p-6">
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">快捷操作</h3>
            <div className="flex flex-wrap gap-3">
              {(quickActions[role] || quickActions.front_desk).map((action, i) => (
                <button key={i} className={`px-5 py-2.5 rounded-lg text-sm font-medium hover:scale-105 transition-transform ${action.color}`}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-6">
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">
              {role === 'staff' ? '我的任务' : role === 'gm' ? '经营概览' : '今日待办'}
            </h3>
            <div className="space-y-3">
              {(role === 'staff'
                ? [{ text: '301号房送餐服务', tag: '紧急' }, { text: '502号房洗衣收取', tag: '普通' }, { text: '701号房补充迷你吧', tag: '普通' }]
                : [{ text: '12位客人今日入住', tag: '入住' }, { text: '8位客人今日退房', tag: '退房' }, { text: '6项服务请求待处理', tag: '待处理' }, { text: '入住率78.5%', tag: '统计' }]
              ).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#C9A96E]/10 last:border-0">
                  <span className="text-sm text-[#F5F0EB]/80">{item.text}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E]">{item.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="gradient-border p-6">
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">系统提醒</h3>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className={`border-l-2 ${alertColors[alert.type]} pl-3 py-1.5`}>
                  <p className="text-sm text-[#F5F0EB]/80">{alert.text}</p>
                  <span className="text-xs text-[#F5F0EB]/30">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
