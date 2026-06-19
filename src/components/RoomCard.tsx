import { BedDouble, User } from 'lucide-react'
import type { Room } from '@/store/useRoomStore'
import StatusBadge from './StatusBadge'

interface RoomCardProps {
  room: Room
  onClick: (room: Room) => void
}

const typeIcons: Record<string, string> = {
  standard: '🛏️',
  deluxe: '🌟',
  suite: '👑',
  presidential: '💎',
}

const typeLabels: Record<string, string> = {
  standard: '标准间',
  deluxe: '豪华间',
  suite: '套房',
  presidential: '总统套房',
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const statusBarColors: Record<string, string> = {
    available: '#34D399',
    occupied: '#C9A96E',
    cleaning: '#F59E0B',
    maintenance: '#EF4444',
    reserved: '#3B82F6',
  }

  return (
    <button
      onClick={() => onClick(room)}
      className="group relative bg-[#1B2A4A] rounded-xl overflow-hidden border border-[#C9A96E]/10 hover:border-[#C9A96E]/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#C9A96E]/10 text-left w-full"
    >
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: statusBarColors[room.status] || '#C9A96E' }}
      />
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-[#F5F0EB] font-['Playfair_Display']">{room.number}</span>
          <span className="text-sm">{typeIcons[room.type]}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <BedDouble className="w-3.5 h-3.5 text-[#C9A96E]/60" />
          <span className="text-xs text-[#F5F0EB]/50">{typeLabels[room.type]}</span>
        </div>
        <StatusBadge status={room.status} type="room" />
        {room.guestName && (
          <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <User className="w-3 h-3 text-[#C9A96E]/60" />
            <span className="text-xs text-[#C9A96E]">{room.guestName}</span>
          </div>
        )}
      </div>
    </button>
  )
}
