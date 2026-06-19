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
  fetchUserInfo: () => Promise<void>
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,

  login: async (employeeId, password, role) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, password, role }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '登录失败')
    }
    const token = data.token
    const user = data.user
    localStorage.setItem('token', token)
    set({
      user: {
        id: String(user.id),
        name: user.name,
        role: user.role,
        avatar: user.avatar || '',
      },
      token,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: () => {
    const token = localStorage.getItem('token')
    if (token) {
      get().fetchUserInfo().catch(() => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      })
    }
  },

  fetchUserInfo: async () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('未登录')
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false })
      throw new Error('验证失败')
    }
    const data = await res.json()
    set({
      user: {
        id: String(data.data.id),
        name: data.data.name,
        role: data.data.role,
        avatar: data.data.avatar || '',
      },
      isAuthenticated: true,
    })
  },
}))

export default useAuthStore
