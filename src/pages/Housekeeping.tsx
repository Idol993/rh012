import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle, Filter, Play } from 'lucide-react'
import useRoomStore from '@/store/useRoomStore'
import useAuthStore from '@/store/useAuthStore'
import StatusBadge from '@/components/StatusBadge'

interface TaskAssignedTo {
  id: number
  name: string
}

interface Task {
  id: number
  roomId: number
  roomNumber: string
  floor: number
  type: 'checkout_clean' | 'daily_clean' | 'deep_clean'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  assignedTo: TaskAssignedTo | null
  createdAt: string
  completedAt?: string
  qualityScore?: number
}

const typeLabels: Record<string, string> = {
  checkout_clean: '退房清洁',
  daily_clean: '日常清洁',
  deep_clean: '深度清洁',
}

const priorityColors: Record<string, string> = { low: '#34D399', medium: '#3B82F6', high: '#EF4444' }
const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }

export default function Housekeeping() {
  const { fetchRooms, updateRoomStatus } = useRoomStore()
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState<number | null>(null)
  const [scanSuccess, setScanSuccess] = useState<number | null>(null)
  const [startingTask, setStartingTask] = useState<number | null>(null)
  const [floorFilter, setFloorFilter] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/housekeeping/tasks')
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '获取清洁任务失败')
      }
      setTasks(data.data)
    } catch (err: any) {
      setError(err.message || '获取清洁任务失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchRooms()
  }, [fetchRooms])

  const handleStartClean = async (taskId: number) => {
    setStartingTask(taskId)
    try {
      const res = await fetch(`/api/housekeeping/tasks/${taskId}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: Number(user?.id) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '开始清洁失败')
      }
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: 'in_progress' } : t))
    } catch (err: any) {
      setError(err.message || '开始清洁失败')
    } finally {
      setStartingTask(null)
    }
  }

  const handleScanClean = async (task: Task) => {
    setScanning(task.id)
    try {
      const res = await fetch('/api/housekeeping/scan-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: task.roomId, staffId: Number(user?.id) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || '清洁完成失败')
      }
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t))
      updateRoomStatus(task.roomId, 'available')
      setScanSuccess(task.id)
      setTimeout(() => setScanSuccess(null), 1500)
    } catch (err: any) {
      setError(err.message || '清洁完成失败')
      setScanning(null)
    } finally {
      if (scanSuccess !== task.id) {
        setScanning(null)
      }
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (floorFilter !== 0 && t.floor !== floorFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    return true
  })

  const floors = [...new Set(tasks.map((t) => t.floor))].sort()
  const types = Object.keys(typeLabels)
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {error && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      <div className="gradient-border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C9A96E]" />
            <select value={floorFilter} onChange={(e) => setFloorFilter(Number(e.target.value))} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-1.5 text-sm text-[#F5F0EB]">
              <option value={0}>全部楼层</option>
              {floors.map((f) => <option key={f} value={f}>{f}楼</option>)}
            </select>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-1.5 text-sm text-[#F5F0EB]">
            <option value="all">全部类型</option>
            {types.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg px-3 py-1.5 text-sm text-[#F5F0EB]">
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <div className="flex-1" />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#F5F0EB]/50">总计 {stats.total}</span>
            <span className="text-[#EF4444]">待处理 {stats.pending}</span>
            <span className="text-[#3B82F6]">进行中 {stats.inProgress}</span>
            <span className="text-[#34D399]">已完成 {stats.completed}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#F5F0EB]/40">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="gradient-border p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: priorityColors[task.priority] }} />
              <div className="flex items-center justify-between mb-3 pl-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#C9A96E] font-['Playfair_Display']">{task.roomNumber}</span>
                  <span className="text-xs text-[#F5F0EB]/50">{task.floor}楼</span>
                </div>
                <StatusBadge status={task.status} type="task" />
              </div>
              <div className="pl-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#F5F0EB]/70">{typeLabels[task.type] || task.type}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: priorityColors[task.priority], backgroundColor: priorityColors[task.priority] + '20' }}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                <div className="text-xs text-[#F5F0EB]/40">负责人：{task.assignedTo?.name || '未分配'}</div>
                {task.status === 'pending' && (
                  <button
                    onClick={() => handleStartClean(task.id)}
                    disabled={startingTask === task.id}
                    className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      startingTask === task.id
                        ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                        : 'bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {startingTask === task.id ? '开始中...' : '开始清洁'}
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => handleScanClean(task)}
                    disabled={scanning === task.id}
                    className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      scanning === task.id
                        ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                        : scanSuccess === task.id
                        ? 'bg-[#34D399]/20 text-[#34D399]'
                        : 'bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] hover:shadow-[0_0_15px_rgba(201,169,110,0.3)]'
                    }`}
                  >
                    {scanning === task.id ? (
                      <><Sparkles className="w-4 h-4 animate-spin" />扫描中...</>
                    ) : scanSuccess === task.id ? (
                      <><CheckCircle className="w-4 h-4" />清洁完成</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />扫描清洁</>
                    )}
                  </button>
                )}
                {task.status === 'completed' && task.qualityScore !== undefined && (
                  <div className="text-xs text-[#34D399]/70">
                    质量评分：{task.qualityScore}分
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTasks.length === 0 && (
        <div className="text-center py-12 text-[#F5F0EB]/40">暂无任务</div>
      )}
    </div>
  )
}
