import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter } from 'lucide-react'
import useRoomStore from '@/store/useRoomStore'
import type { Room, RoomStatus } from '@/store/useRoomStore'
import RoomCard from '@/components/RoomCard'
import IoTPanel from '@/components/IoTPanel'

const statusFilters: { key: RoomStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: '#F5F0EB' },
  { key: 'available', label: '空闲', color: '#34D399' },
  { key: 'occupied', label: '入住', color: '#C9A96E' },
  { key: 'cleaning', label: '清洁中', color: '#F59E0B' },
  { key: 'maintenance', label: '维修', color: '#EF4444' },
  { key: 'reserved', label: '预留', color: '#3B82F6' },
]

const typeLabels: Record<string, string> = { standard: '标准间', deluxe: '豪华间', suite: '套房', presidential: '总统套房' }

export default function Rooms() {
  const navigate = useNavigate()
  const { rooms, selectedRoom, selectedTimeline, fetchRooms, selectRoom, deselectRoom, updateIoT } = useRoomStore()
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all')
  const [floorFilter, setFloorFilter] = useState<number>(0)

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const filteredRooms = rooms.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (floorFilter !== 0 && r.floor !== floorFilter) return false
    return true
  })

  const floors = [...new Set(rooms.map((r) => r.floor))].sort()
  const counts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    cleaning: rooms.filter((r) => r.status === 'cleaning').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  }

  const handleRoomClick = (room: Room) => {
    selectRoom(room.id)
  }

  const handleIoTUpdate = (device: 'ac' | 'light' | 'curtain', settings: Record<string, any>) => {
    if (selectedRoom) {
      updateIoT(selectedRoom.id, device, settings)
    }
  }

  const roomsByFloor = floors.map((floor) => ({
    floor,
    rooms: filteredRooms.filter((r) => r.floor === floor),
  }))

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="gradient-border p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#C9A96E]" />
              <span className="text-sm text-[#F5F0EB]/60">状态：</span>
              {statusFilters.map((sf) => (
                <button
                  key={sf.key}
                  onClick={() => setStatusFilter(sf.key)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    statusFilter === sf.key
                      ? 'text-white'
                      : 'bg-[#F5F0EB]/5 text-[#F5F0EB]/50 hover:bg-[#F5F0EB]/10'
                  }`}
                  style={statusFilter === sf.key ? { backgroundColor: sf.color + '30', color: sf.color } : {}}
                >
                  {sf.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#F5F0EB]/60">楼层：</span>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(Number(e.target.value))}
                className="bg-[#0D1B2A] border border-[#C9A96E]/20 rounded-lg px-3 py-1 text-sm text-[#F5F0EB]"
              >
                <option value={0}>全部</option>
                {floors.map((f) => (
                  <option key={f} value={f}>{f}楼</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {roomsByFloor.map(({ floor, rooms: floorRooms }) => (
            floorRooms.length > 0 && (
              <div key={floor} className="gradient-border p-4">
                <h4 className="text-sm font-medium text-[#C9A96E] mb-3">{floor}楼</h4>
                <div className="grid grid-cols-5 gap-3">
                  {floorRooms.map((room) => (
                    <RoomCard key={room.id} room={room} onClick={handleRoomClick} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="mt-4 gradient-border p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-[#F5F0EB]/50">客房总计：<span className="text-[#F5F0EB]">{counts.total}</span></span>
            <span className="text-[#34D399]">空闲：{counts.available}</span>
            <span className="text-[#C9A96E]">入住：{counts.occupied}</span>
            <span className="text-[#F59E0B]">清洁中：{counts.cleaning}</span>
            <span className="text-[#EF4444]">维修：{counts.maintenance}</span>
          </div>
        </div>
      </div>

      {selectedRoom && (
        <div className="flex-shrink-0">
          <IoTPanel
            key={selectedRoom.id}
            roomNumber={selectedRoom.roomNumber}
            iot={selectedRoom.iotDevices}
            onUpdate={handleIoTUpdate}
            onClose={deselectRoom}
            guest={selectedRoom.currentGuest}
            reservation={selectedRoom.reservation}
            onRequestService={() => navigate(`/services?roomNumber=${selectedRoom.roomNumber}`)}
            timeline={selectedTimeline}
          />
        </div>
      )}
    </div>
  )
}
