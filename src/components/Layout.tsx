import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useAuthStore from '@/store/useAuthStore'

export default function Layout() {
  const { isAuthenticated } = useAuthStore()

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
