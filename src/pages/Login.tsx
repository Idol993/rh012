import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Headphones, ClipboardList, Crown } from 'lucide-react'
import useAuthStore from '@/store/useAuthStore'
import type { Role } from '@/store/useAuthStore'

const roles: { key: Role; label: string; icon: typeof User; color: string }[] = [
  { key: 'staff', label: '服务员', icon: User, color: '#3B82F6' },
  { key: 'front_desk', label: '前台', icon: Headphones, color: '#C9A96E' },
  { key: 'housekeeping_supervisor', label: '客房主管', icon: ClipboardList, color: '#F59E0B' },
  { key: 'gm', label: '总经理', icon: Crown, color: '#8B5CF6' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<Role>('front_desk')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId.trim()) {
      setError('请输入工号')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(employeeId, password, selectedRole)
      navigate('/dashboard')
    } catch {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1B2A] via-[#1B2A4A] to-[#0D1B2A] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08),transparent_70%)]" />

      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-[#C9A96E] mx-auto mb-4 animate-gold-pulse" />
          <h1 className="text-4xl font-bold text-[#C9A96E] font-['Playfair_Display'] tracking-wider">ROYAL PMS</h1>
          <p className="text-[#F5F0EB]/40 mt-2 tracking-widest text-sm">豪华酒店管理系统</p>
        </div>

        <div className="glass-card gold-border-glow p-8">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {roles.map((r) => {
              const Icon = r.icon
              const isActive = selectedRole === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => setSelectedRole(r.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? 'bg-[#C9A96E]/15 border-[#C9A96E]/60 shadow-[0_0_15px_rgba(201,169,110,0.3)]'
                      : 'bg-[#0D1B2A]/50 border-[#C9A96E]/10 hover:border-[#C9A96E]/30'
                  }`}
                >
                  <Icon className="w-6 h-6" style={{ color: isActive ? r.color : '#F5F0EB60' }} />
                  <span className={`text-xs ${isActive ? 'text-[#C9A96E]' : 'text-[#F5F0EB]/40'}`}>{r.label}</span>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">工号</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="请输入工号"
                className="w-full px-4 py-3 bg-[#0D1B2A]/60 border border-[#C9A96E]/20 rounded-lg text-[#F5F0EB] placeholder-[#F5F0EB]/25 text-sm focus:border-[#C9A96E] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[#F5F0EB]/50 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 bg-[#0D1B2A]/60 border border-[#C9A96E]/20 rounded-lg text-[#F5F0EB] placeholder-[#F5F0EB]/25 text-sm focus:border-[#C9A96E] transition-all"
              />
            </div>
            {error && <p className="text-[#EF4444] text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] font-bold rounded-lg hover:shadow-[0_0_20px_rgba(201,169,110,0.4)] transition-all duration-300 disabled:opacity-50 text-sm tracking-wider"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#F5F0EB]/20 mt-6">© 2026 Royal Hotel Group. All rights reserved.</p>
      </div>
    </div>
  )
}
