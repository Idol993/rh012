import { useEffect, useState } from 'react'
import { Plus, Wand2, Clock, Droplets, Shirt, Sparkles, Wrench, HelpCircle } from 'lucide-react'
import useServiceStore from '@/store/useServiceStore'
import useRoomStore from '@/store/useRoomStore'
import type { ServiceType, ServiceStatus, Priority } from '@/store/useServiceStore'

const typeIcons: Record<ServiceType, typeof Droplets> = {
  water: Droplets,
  towel: Shirt,
  cleaning: Sparkles,
  maintenance: Wrench,
  other: HelpCircle,
}

const typeLabels: Record<ServiceType, string> = {
  water: '送水',
  towel: '毛巾',
  cleaning: '清洁',
  maintenance: '维修',
  other: '其他',
}

const priorityColors: Record<Priority, string> = {
  low: '#34D399', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444',
}

const priorityLabels: Record<Priority, string> = {
  low: '低', medium: '中', high: '高', urgent: '紧急',
}

const columns: { key: ServiceStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'assigned', label: '已派单' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

export default function Services() {
  const { serviceRequests, fetchRequests, createRequest, updateRequestStatus, autoDispatch } = useServiceStore()
  const { rooms, fetchRooms } = useRoomStore()
  const [showNewModal, setShowNewModal] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<{ id: number; staff: { id: number; name: string; distance: string } } | null>(null)
  const [newForm, setNewForm] = useState({ roomNumber: '', type: 'water' as ServiceType, description: '', priority: 'medium' as Priority })

  useEffect(() => {
    fetchRequests()
    fetchRooms()
  }, [fetchRequests, fetchRooms])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const room = rooms.find((r) => r.roomNumber === newForm.roomNumber)
    if (!room) {
      alert('未找到该房间号，请确认后重试')
      return
    }
    try {
      await createRequest({ roomId: room.id, type: newForm.type, description: newForm.description, priority: newForm.priority })
      await fetchRequests()
      setShowNewModal(false)
      setNewForm({ roomNumber: '', type: 'water', description: '', priority: 'medium' })
    } catch (err: any) {
      alert(err.message || '创建失败')
    }
  }

  const handleAutoDispatch = async (id: number) => {
    try {
      const result = await autoDispatch(id)
      setDispatchResult({ id, staff: result.assignedStaff })
    } catch (err: any) {
      alert(err.message || '派单失败')
    }
  }

  const handleConfirmDispatch = async (serviceId: number) => {
    await fetchRequests()
    setDispatchResult(null)
  }

  const handleStatusChange = async (id: number, status: ServiceStatus) => {
    try {
      await updateRequestStatus(id, status)
      await fetchRequests()
    } catch (err: any) {
      alert(err.message || '状态更新失败')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1" />
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />新建请求
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = serviceRequests.filter((r) => r.status === col.key)
          return (
            <div key={col.key} className="gradient-border p-4 min-h-[60vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#C9A96E]">{col.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E]">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((req) => {
                  const Icon = typeIcons[req.type]
                  return (
                    <div key={req.id} className="bg-[#0D1B2A]/50 rounded-lg border border-[#C9A96E]/10 p-3 hover:border-[#C9A96E]/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#C9A96E]" />
                          <span className="text-sm font-medium text-[#F5F0EB]">{req.roomNumber}号房</span>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: priorityColors[req.priority], backgroundColor: priorityColors[req.priority] + '20' }}>
                          {priorityLabels[req.priority]}
                        </span>
                      </div>
                      <p className="text-xs text-[#F5F0EB]/60 mb-2">{typeLabels[req.type]} - {req.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#F5F0EB]/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {req.status === 'pending' && (
                          <button onClick={() => handleAutoDispatch(req.id)} className="text-xs text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1">
                            <Wand2 className="w-3 h-3" />智能派单
                          </button>
                        )}
                        {req.status === 'assigned' && (
                          <button onClick={() => handleStatusChange(req.id, 'in_progress')} className="text-xs text-[#34D399] hover:text-[#34D399]/80">
                            开始处理
                          </button>
                        )}
                        {req.status === 'in_progress' && (
                          <button onClick={() => handleStatusChange(req.id, 'completed')} className="text-xs text-[#34D399] hover:text-[#34D399]/80">
                            完成
                          </button>
                        )}
                      </div>
                      {req.assignedTo && (
                        <div className="mt-2 text-xs text-[#F5F0EB]/40">处理人：{req.assignedTo.name}</div>
                      )}
                      {req.completedAt && (
                        <div className="mt-1 text-xs text-[#34D399]/60">完成于：{new Date(req.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowNewModal(false)}>
          <div className="glass-card gold-border-glow p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">新建服务请求</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="房间号（如801）" value={newForm.roomNumber} onChange={(e) => setNewForm({ ...newForm, roomNumber: e.target.value })} className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25" required />
              <select value={newForm.type} onChange={(e) => setNewForm({ ...newForm, type: e.target.value as ServiceType })} className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB]">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <textarea placeholder="描述" value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB] placeholder-[#F5F0EB]/25 h-20 resize-none" />
              <select value={newForm.priority} onChange={(e) => setNewForm({ ...newForm, priority: e.target.value as Priority })} className="w-full px-4 py-2.5 bg-[#0D1B2A]/50 border border-[#C9A96E]/20 rounded-lg text-sm text-[#F5F0EB]">
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] font-bold rounded-lg text-sm">提交请求</button>
            </form>
          </div>
        </div>
      )}

      {dispatchResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setDispatchResult(null)}>
          <div className="glass-card gold-border-glow p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">智能派单结果</h3>
            <div className="space-y-3">
              <button onClick={() => handleConfirmDispatch(dispatchResult.id)} className="w-full p-3 bg-[#0D1B2A]/50 rounded-lg border border-[#C9A96E]/10 hover:border-[#C9A96E]/40 transition-all text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#F5F0EB]">{dispatchResult.staff.name}</span>
                  <span className="text-xs text-[#C9A96E]">距离：{dispatchResult.staff.distance}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
