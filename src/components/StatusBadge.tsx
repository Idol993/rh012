interface StatusBadgeProps {
  status: string
  type: 'room' | 'reservation' | 'service' | 'task'
}

const roomColors: Record<string, string> = {
  available: 'bg-[#34D399]/20 text-[#34D399]',
  occupied: 'bg-[#C9A96E]/20 text-[#C9A96E]',
  cleaning: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  maintenance: 'bg-[#EF4444]/20 text-[#EF4444]',
  reserved: 'bg-[#3B82F6]/20 text-[#3B82F6]',
}

const roomLabels: Record<string, string> = {
  available: '空闲',
  occupied: '入住',
  cleaning: '清洁中',
  maintenance: '维修',
  reserved: '预留',
}

const reservationColors: Record<string, string> = {
  pending: 'bg-[#F5F0EB]/10 text-[#F5F0EB]/60',
  confirmed: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  checked_in: 'bg-[#34D399]/20 text-[#34D399]',
  checked_out: 'bg-[#F5F0EB]/10 text-[#F5F0EB]/40',
  cancelled: 'bg-[#EF4444]/20 text-[#EF4444]',
}

const reservationLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已入住',
  checked_out: '已退房',
  cancelled: '已取消',
}

const serviceColors: Record<string, string> = {
  pending: 'bg-[#EF4444]/20 text-[#EF4444]',
  assigned: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  in_progress: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  completed: 'bg-[#34D399]/20 text-[#34D399]',
}

const serviceLabels: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  let colorClass = ''
  let label = status

  if (type === 'room') {
    colorClass = roomColors[status] || roomColors.available
    label = roomLabels[status] || status
  } else if (type === 'reservation') {
    colorClass = reservationColors[status] || reservationColors.pending
    label = reservationLabels[status] || status
  } else if (type === 'service' || type === 'task') {
    colorClass = serviceColors[status] || serviceColors.pending
    label = serviceLabels[status] || status
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
