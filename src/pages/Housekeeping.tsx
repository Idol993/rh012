import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle, Filter } from 'lucide-react'
import useRoomStore from '@/store/useRoomStore'
import type { RoomStatus } from '@/store/useRoomStore'
import StatusBadge from '@/components/StatusBadge'

interface Task {
  id: string
  roomNumber: string
  floor: number
  type: string
  priority: 'low' | 'medium' | 'high'
  assignedTo: string
  status: 'pending' | 'in_progress' | 'completed'
}

const generateTasks = (): Task[] => [
  { id: 't1', roomNumber: '301', floor: 3, type: '退房清洁', priority: 'high', assignedTo: '小李', status: 'pending' },
  { id: 't2', roomNumber: '502', floor: 5, type: '日常清洁', priority: 'medium', assignedTo: '小王', status: 'in_progress' },
  { id: 't3', roomNumber: '701', floor: 7, type: '深度清洁', priority: 'low', assignedTo: '小张', status: 'pending' },
  { id: 't4', roomNumber: '203', floor: 2, type: '退房清洁', priority: 'high', assignedTo: '小陈', status: 'completed' },
  { id: 't5', roomNumber: '604', floor: 6, type: '日常清洁', priority: 'medium', assignedTo: '小李', status: 'in_progress' },
  { id: 't6', roomNumber: '105', floor: 1, type: '维修后清洁', priority: 'high', assignedTo: '小王', status: 'pending' },
  { id: 't7', roomNumber: '403', floor: 4, type: 'VIP清洁', priority: 'high', assignedTo: '小张', status: 'pending' },
  { id: 't8', roomNumber: '805', floor: 8, type: '日常清洁', priority: 'low', assignedTo: '小陈', status: 'completed' },
]

const priorityColors: Record<string, string> = { low: '#34D399', medium: '#3B82F6', high: '#EF4444' }
const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }

export default function Housekeeping() {
  const { rooms, fetchRooms, updateRoomStatus } = useRoomStore()
  const [tasks, setTasks] = useState<Task[]>(generateTasks)
  const [scanning, setScanning] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState<string | null>(null)
  const [floorFilter, setFloorFilter] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const filteredTasks = tasks.filter((t) => {
    if (floorFilter !== 0 && t.floor !== floorFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    return true
  })

  const handleScanClean = (taskId: string, roomNumber: string) => {
    setScanning(taskId)
    setTimeout(() => {
      setScanning(null)
      setScanSuccess(taskId)
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: 'completed' } : t))
      const room = rooms.find((r) => r.number === roomNumber)
      if (room) {
        updateRoomStatus(room.id, 'available')
      }
      setTimeout(() => setScanSuccess(null), 1500)
    }, 2000)
  }

  const floors = [...new Set(tasks.map((t) => t.floor))].sort()
  const types = [...new Set(tasks.map((t) => t.type))]
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  return (
    <div className="space-y-4 animate-fade-in">
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
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
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
                <span className="text-sm text-[#F5F0EB]/70">{task.type}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: priorityColors[task.priority], backgroundColor: priorityColors[task.priority] + '20' }}>
                  {priorityLabels[task.priority]}
                </span>
              </div>
              <div className="text-xs text-[#F5F0EB]/40">负责人：{task.assignedTo}</div>
              {task.status !== 'completed' && (
                <button
                  onClick={() => handleScanClean(task.id, task.roomNumber)}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
