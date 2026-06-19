import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/rooms': '客房管理',
  '/reservations': '预订管理',
  '/reservations/new': '新建预订',
  '/checkin': '自助入住',
  '/services': '服务请求',
  '/housekeeping': '客房服务',
  '/members': '会员管理',
  '/gm-dashboard': '总经理看板',
  '/reports': '报表中心',
}

export default function TopBar() {
  const location = useLocation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pathKey = location.pathname
  const title = pageTitles[pathKey] || '仪表盘'

  const breadcrumbs = pathKey.split('/').filter(Boolean)
  const formatDate = (d: Date) =>
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`

  return (
    <header className="h-16 bg-[#1B2A4A]/80 backdrop-blur-md border-b border-[#C9A96E]/10 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#F5F0EB] font-['Playfair_Display']">{title}</h2>
          <div className="flex items-center gap-1 text-xs text-[#F5F0EB]/40">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span>{pageTitles['/' + bc] || bc}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EB]/40" />
          <input
            type="text"
            placeholder="搜索..."
            className="pl-10 pr-4 py-2 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/30 w-56 focus:border-[#C9A96E] transition-colors"
          />
        </div>
        <span className="text-sm text-[#F5F0EB]/60">{formatDate(time)}</span>
        <button className="relative p-2 text-[#F5F0EB]/60 hover:text-[#C9A96E] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
        </button>
      </div>
    </header>
  )
}
