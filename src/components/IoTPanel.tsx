import { useState } from 'react'
import { X, Thermometer, Sun, Blinds, Power } from 'lucide-react'
import type { IoTState } from '@/store/useRoomStore'

interface IoTPanelProps {
  roomNumber: string
  iot: IoTState
  onUpdate: (device: string, settings: Partial<IoTState>) => void
  onClose: () => void
}

export default function IoTPanel({ roomNumber, iot, onUpdate, onClose }: IoTPanelProps) {
  const [acTemp, setAcTemp] = useState(iot.ac.temperature)
  const [acMode, setAcMode] = useState(iot.ac.mode)
  const [acPower, setAcPower] = useState(iot.ac.power)
  const [lightBrightness, setLightBrightness] = useState(iot.light.brightness)
  const [lightPower, setLightPower] = useState(iot.light.power)
  const [curtainOpen, setCurtainOpen] = useState(iot.curtain)

  const modeLabels: Record<string, string> = { cool: '制冷', heat: '制热', auto: '自动' }

  const toggleSwitch = (on: boolean) => (
    <div className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 ${on ? 'bg-[#C9A96E]' : 'bg-[#F5F0EB]/20'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  )

  return (
    <div className="animate-slide-in-right w-80 bg-[#0D1B2A] border-l border-[#C9A96E]/20 h-full overflow-y-auto">
      <div className="p-4 border-b border-[#C9A96E]/20 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#C9A96E] font-['Playfair_Display']">IoT 控制 - {roomNumber}号房</h3>
        <button onClick={onClose} className="p-1 text-[#F5F0EB]/40 hover:text-[#F5F0EB] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
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
                onUpdate('ac', { ...iot, ac: { ...iot.ac, power: newVal } })
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
              onMouseUp={() => onUpdate('ac', { ...iot, ac: { ...iot.ac, temperature: acTemp } })}
              className="w-full h-1.5 bg-[#F5F0EB]/10 rounded-lg appearance-none cursor-pointer accent-[#C9A96E]"
            />
          </div>
          <div className="flex gap-2">
            {(['cool', 'heat', 'auto'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setAcMode(mode)
                  onUpdate('ac', { ...iot, ac: { ...iot.ac, mode } })
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
                onUpdate('light', { ...iot, light: { ...iot.light, power: newVal } })
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
              onMouseUp={() => onUpdate('light', { ...iot, light: { ...iot.light, brightness: lightBrightness } })}
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
                onUpdate('curtain', { ...iot, curtain: newVal })
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
