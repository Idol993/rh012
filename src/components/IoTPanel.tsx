import { useState } from 'react'
import { X, Thermometer, Sun, Blinds, Power, User, MessageCircle } from 'lucide-react'
import type { IoTState } from '@/store/useRoomStore'

interface GuestInfo {
  id: number
  name: string
  phone: string
  memberId?: number
}
interface ReservationInfo {
  reservationId: number
  checkIn: string
  checkOut: string
  keyType?: string
  memberTier?: string
}
interface IoTPanelProps {
  roomNumber: string
  iot: IoTState
  onUpdate: (device: 'ac' | 'light' | 'curtain', settings: Record<string, any>) => void
  onClose: () => void
  guest?: GuestInfo | null
  reservation?: ReservationInfo | null
  onRequestService?: () => void
}

export default function IoTPanel({ roomNumber, iot, onUpdate, onClose, guest, reservation, onRequestService }: IoTPanelProps) {
  const [acTemp, setAcTemp] = useState(iot.ac.temperature)
  const [acMode, setAcMode] = useState(iot.ac.mode)
  const [acPower, setAcPower] = useState(iot.ac.power)
  const [lightBrightness, setLightBrightness] = useState(iot.light.brightness)
  const [lightPower, setLightPower] = useState(iot.light.power)
  const [curtainOpen, setCurtainOpen] = useState(iot.curtain.open)

  const modeLabels: Record<string, string> = { cool: '制冷', heat: '制热', auto: '自动' }

  const toggleSwitch = (on: boolean) => (
    <div className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 ${on ? 'bg-[#C9A96E]' : 'bg-[#F5F0EB]/20'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  )

  const maskPhone = (phone: string) => {
    if (phone.length < 7) return phone
    return phone.slice(0, 3) + '****' + phone.slice(-4)
  }

  const memberTierMap: Record<string, { label: string; color: string }> = {
    diamond: { label: '💎钻石', color: '#C9A96E' },
    platinum: { label: '👑白金', color: '#E5E7EB' },
    gold: { label: '🥇金卡', color: '#F59E0B' },
    silver: { label: '🥈银卡', color: '#9CA3AF' },
  }

  const keyTypeMap: Record<string, string> = {
    card: '房卡',
    bluetooth: '蓝牙钥匙',
  }

  return (
    <div className="animate-slide-in-right w-80 bg-[#0D1B2A] border-l border-[#C9A96E]/20 h-full overflow-y-auto">
      <div className="p-4 border-b border-[#C9A96E]/20 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#C9A96E] font-['Playfair_Display']">IoT 控制 - {roomNumber}号房</h3>
        <button onClick={onClose} className="p-1 text-[#F5F0EB]/40 hover:text-[#F5F0EB] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {guest && (
          <div className="gradient-border p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#C9A96E]/10">
              <User className="w-4 h-4 text-[#C9A96E]" />
              <span className="text-sm font-bold text-[#C9A96E]">客人信息</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F5F0EB]/50">客人姓名</span>
                <span className="text-[#F5F0EB] font-medium">{guest.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F5F0EB]/50">电话</span>
                <span className="text-[#F5F0EB] font-medium">{maskPhone(guest.phone)}</span>
              </div>

              {reservation && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F5F0EB]/50">入住日期</span>
                    <span className="text-[#F5F0EB] font-medium">{reservation.checkIn} → {reservation.checkOut}</span>
                  </div>
                  {reservation.memberTier && memberTierMap[reservation.memberTier] && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#F5F0EB]/50">会员等级</span>
                      <span style={{ color: memberTierMap[reservation.memberTier].color }} className="font-medium">
                        {memberTierMap[reservation.memberTier].label}
                      </span>
                    </div>
                  )}
                  {reservation.keyType && keyTypeMap[reservation.keyType] && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#F5F0EB]/50">钥匙类型</span>
                      <span className="text-[#F5F0EB] font-medium">{keyTypeMap[reservation.keyType]}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {onRequestService && (
              <button
                onClick={onRequestService}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] rounded-lg text-xs font-medium transition-all hover:opacity-90"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                发起服务请求
              </button>
            )}
          </div>
        )}

        <div className="gradient-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-[#3B82F6]" />
              <span className="text-sm font-medium text-[#F5F0EB]">空调</span>
            </div>
            <button
              onClick={() => {
                const newVal = !acPower
                setAcPower(newVal)
                onUpdate('ac', { power: newVal })
              }}
            >
              {toggleSwitch(acPower)}
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#F5F0EB]/50">温度</span>
              <span className="text-sm font-bold text-[#C9A96E]">{acTemp}°C</span>
            </div>
            <input
              type="range"
              min={16}
              max={30}
              value={acTemp}
              onChange={(e) => setAcTemp(Number(e.target.value))}
              onMouseUp={() => onUpdate('ac', { temperature: acTemp })}
              className="w-full h-1.5 bg-[#F5F0EB]/10 rounded-lg appearance-none cursor-pointer accent-[#C9A96E]"
            />
          </div>
          <div className="flex gap-2">
            {(['cool', 'heat', 'auto'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAcMode(mode)
                  onUpdate('ac', { mode })
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                  acMode === mode
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/40'
                    : 'bg-[#F5F0EB]/5 text-[#F5F0EB]/40 border border-transparent'
                }`}
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="gradient-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#F59E0B]" />
              <span className="text-sm font-medium text-[#F5F0EB]">灯光</span>
            </div>
            <button
              onClick={() => {
                const newVal = !lightPower
                setLightPower(newVal)
                onUpdate('light', { power: newVal })
              }}
            >
              {toggleSwitch(lightPower)}
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#F5F0EB]/50">亮度</span>
              <span className="text-sm font-bold text-[#C9A96E]">{lightBrightness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={lightBrightness}
              onChange={(e) => setLightBrightness(Number(e.target.value))}
              onMouseUp={() => onUpdate('light', { brightness: lightBrightness })}
              className="w-full h-1.5 bg-[#F5F0EB]/10 rounded-lg appearance-none cursor-pointer accent-[#C9A96E]"
            />
          </div>
        </div>

        <div className="gradient-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Blinds className="w-5 h-5 text-[#8B5CF6]" />
              <span className="text-sm font-medium text-[#F5F0EB]">窗帘</span>
            </div>
            <button
              onClick={() => {
                const newVal = !curtainOpen
                setCurtainOpen(newVal)
                onUpdate('curtain', { open: newVal })
              }}
            >
              {toggleSwitch(curtainOpen)}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#F5F0EB]/50">
            <Power className="w-3 h-3" />
            <span>{curtainOpen ? '已打开' : '已关闭'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
