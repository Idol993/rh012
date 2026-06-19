import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, BedDouble, CalendarCheck, LogIn, Bell, Sparkles, Crown, Monitor, FileBarChart, LogOut } from 'lucide-react'
import useAuthStore from '@/store/useAuthStore'

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard, roles: ['front_desk', 'housekeeping_supervisor', 'gm'] },
  { path: '/rooms', label: '客房管理', icon: BedDouble, roles: ['front_desk', 'housekeeping_supervisor', 'gm'] },
  { path: '/reservations', label: '预订管理', icon: CalendarCheck, roles: ['front_desk', 'gm'] },
  { path: '/checkin', label: '自助入住', icon: LogIn, roles: ['front_desk'] },
  { path: '/services', label: '服务请求', icon: Bell, roles: ['staff', 'front_desk', 'housekeeping_supervisor', 'gm'] },
  { path: '/housekeeping', label: '客房服务', icon: Sparkles, roles: ['staff', 'housekeeping_supervisor'] },
  { path: '/members', label: '会员管理', icon: Crown, roles: ['front_desk', 'gm'] },
  { path: '/gm-dashboard', label: '总经理看板', icon: Monitor, roles: ['gm'] },
  { path: '/reports', label: '报表中心', icon: FileBarChart, roles: ['gm'] },
]

const roleLabels: Record<string, string> = {
  staff: '服务员',
  front_desk: '前台',
  housekeeping_supervisor: '客房主管',
  gm: '总经理',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const role = user?.role || 'staff'

  const filteredNav = navItems.filter((item) => item.roles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D1B2A] border-r border-[#C9A96E]/20 flex flex-col z-50">
      <div className="p-6 border-b border-[#C9A96E]/20">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-[#C9A96E]" />
          <h1 className="text-2xl font-bold text-[#C9A96E] font-['Playfair_Display'] tracking-wider">
            ROYAL PMS
          </h1>
        </div>
        <p className="text-xs text-[#C9A96E]/50 mt-1 tracking-widest">豪华酒店管理系统</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#C9A96E]/15 text-[#C9A96E] border-r-2 border-[#C9A96E]'
                  : 'text-[#F5F0EB]/60 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#C9A96E]/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] text-sm font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#F5F0EB] truncate">{user?.name || '未登录'}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E]">
              {roleLabels[role]}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}
