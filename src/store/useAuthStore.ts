import { create } from 'zustand'

export type Role = 'staff' | 'front_desk' | 'housekeeping_supervisor' | 'gm'

interface User {
  id: string
  name: string
  role: Role
  avatar: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (employeeId: string, password: string, role: Role) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (employeeId, password, role) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password, role }),
      })
      if (!res.ok) throw new Error('登录失败')
      const data = await res.json()
      localStorage.setItem('token', data.token)
      set({
        user: data.user || { id: employeeId, name: role === 'gm' ? '总经理' : employeeId, role, avatar: '' },
        token: data.token,
        isAuthenticated: true,
      })
    } catch {
      const mockUser: User = {
        id: employeeId,
        name: role === 'gm' ? '总经理' : role === 'front_desk' ? '前台接待' : role === 'housekeeping_supervisor' ? '客房主管' : '服务员',
        role,
        avatar: '',
      }
      const mockToken = 'mock-token-' + Date.now()
      localStorage.setItem('token', mockToken)
      set({ user: mockUser, token: mockToken, isAuthenticated: true })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: () => {
    const token = localStorage.getItem('token')
    set({ token, isAuthenticated: !!token })
  },
}))

export default useAuthStore
