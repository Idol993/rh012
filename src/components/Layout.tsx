import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useAuthStore from '@/store/useAuthStore'

export default function Layout() {
  const { isAuthenticated, fetchUserInfo } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUserInfo()
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [fetchUserInfo])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D1B2A]">
        <div className="text-[#C9A96E] animate-pulse">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-[#0D1B2A]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6 min-h-[calc(100vh-4rem)] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
