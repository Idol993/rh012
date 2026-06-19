import { useState, useEffect } from 'react'
import { User, CheckCircle, Key, ScanLine } from 'lucide-react'
import useReservationStore from '@/store/useReservationStore'
import StatusBadge from '@/components/StatusBadge'

const steps = ['选择预订', '人脸验证', '发放钥匙', '完成入住']

export default function CheckIn() {
  const { reservations, fetchReservations, checkIn } = useReservationStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRes, setSelectedRes] = useState<number | null>(null)
  const [scanning, setScanning] = useState(false)
  const [verified, setVerified] = useState(false)
  const [keyType, setKeyType] = useState<'card' | 'bluetooth'>('card')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkInResult, setCheckInResult] = useState<{ roomNumber: string; keyInfo: { type: string; code: string } } | null>(null)

  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true)
      setError('')
      try {
        await fetchReservations()
      } catch (err: any) {
        setError(err.message || '获取预订列表失败')
      } finally {
        setLoading(false)
      }
    }
    loadReservations()
  }, [fetchReservations])

  const confirmedRes = reservations.filter((r) => r.status === 'confirmed')

  const handleSelectRes = (id: number) => {
    setSelectedRes(id)
    setCurrentStep(1)
  }

  const handleVerify = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setVerified(true)
      setTimeout(() => setCurrentStep(2), 800)
    }, 2500)
  }

  const handleKeyIssue = async () => {
    if (selectedRes === null) return
    setError('')
    try {
      const result = await checkIn(selectedRes, verified, keyType)
      setCheckInResult({ roomNumber: result.roomNumber, keyInfo: result.keyInfo })
      setCurrentStep(3)
      setTimeout(() => setComplete(true), 500)
    } catch (err: any) {
      setError(err.message || '入住失败')
    }
  }

  const res = reservations.find((r) => r.id === selectedRes)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {error && (
        <div className="p-4 mb-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      <div className="gradient-border p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#C9A96E] font-['Playfair_Display'] mb-6 text-center">自助入住终端</h2>
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  i < currentStep ? 'bg-[#34D399] text-[#0D1B2A]' :
                  i === currentStep ? 'bg-[#C9A96E] text-[#0D1B2A] animate-gold-pulse' :
                  'bg-[#F5F0EB]/10 text-[#F5F0EB]/30'
                }`}>
                  {i < currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-2 ${i <= currentStep ? 'text-[#C9A96E]' : 'text-[#F5F0EB]/30'}`}>{step}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-3 ${i < currentStep ? 'bg-[#34D399]' : 'bg-[#F5F0EB]/10'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 0 && (
        <div className="gradient-border p-6">
          <h3 className="text-lg font-bold text-[#C9A96E] mb-4 font-['Playfair_Display']">今日待入住预订</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-[#F5F0EB]/40 py-8">加载中...</p>
            ) : confirmedRes.length === 0 ? (
              <p className="text-center text-[#F5F0EB]/40 py-8">暂无待入住预订</p>
            ) : (
              confirmedRes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRes(r.id)}
                  className="w-full p-4 bg-[#0D1B2A]/50 rounded-lg border border-[#C9A96E]/10 hover:border-[#C9A96E]/40 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#F5F0EB]">{r.guestName}</span>
                      <span className="text-xs text-[#F5F0EB]/40 ml-3">{r.id}</span>
                    </div>
                    <StatusBadge status={r.status} type="reservation" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#F5F0EB]/50">
                    <span>{r.roomType}</span>
                    <span>{r.checkIn} → {r.checkOut}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="gradient-border p-6 text-center">
          <h3 className="text-lg font-bold text-[#C9A96E] mb-6 font-['Playfair_Display']">人脸验证</h3>
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="w-full h-full rounded-full border-4 border-[#C9A96E]/30 flex items-center justify-center bg-[#0D1B2A] overflow-hidden">
              <User className="w-24 h-24 text-[#F5F0EB]/20" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine className="w-full h-16 text-[#C9A96E] animate-bounce" />
                </div>
              )}
              {scanning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#C9A96E] animate-bounce" style={{ animationDuration: '1.5s' }} />
              )}
            </div>
          </div>
          {verified ? (
            <div className="flex items-center justify-center gap-2 text-[#34D399]">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-medium">验证通过</span>
            </div>
          ) : (
            <button
              onClick={handleVerify}
              disabled={scanning}
              className="px-8 py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] font-bold rounded-lg disabled:opacity-50"
            >
              {scanning ? '验证中...' : '开始验证'}
            </button>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="gradient-border p-6 text-center">
          <h3 className="text-lg font-bold text-[#C9A96E] mb-6 font-['Playfair_Display']">选择钥匙类型</h3>
          <div className="flex justify-center gap-6 mb-6">
            {(['card', 'bluetooth'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setKeyType(type)}
                className={`p-6 rounded-xl border transition-all ${
                  keyType === type ? 'bg-[#C9A96E]/15 border-[#C9A96E]/60' : 'bg-[#0D1B2A]/50 border-[#C9A96E]/10'
                }`}
              >
                <Key className={`w-10 h-10 mx-auto mb-2 ${keyType === type ? 'text-[#C9A96E]' : 'text-[#F5F0EB]/30'}`} />
                <span className={`text-sm ${keyType === type ? 'text-[#C9A96E]' : 'text-[#F5F0EB]/40'}`}>
                  {type === 'card' ? '房卡' : '蓝牙钥匙'}
                </span>
              </button>
            ))}
          </div>
          <div className="gradient-border p-4 mb-6">
            <p className="text-xs text-[#F5F0EB]/50 mb-1">钥匙码</p>
            <p className="text-2xl font-bold text-[#C9A96E] font-mono tracking-widest">
              {checkInResult?.keyInfo?.code || '------'}
            </p>
          </div>
          <button onClick={handleKeyIssue} className="px-8 py-3 bg-gradient-to-r from-[#C9A96E] to-[#E8D5B0] text-[#0D1B2A] font-bold rounded-lg">
            发放钥匙
          </button>
        </div>
      )}

      {currentStep === 3 && complete && (
        <div className="gradient-border p-8 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#34D399]/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#34D399]" />
          </div>
          <h3 className="text-2xl font-bold text-[#34D399] mb-2 font-['Playfair_Display']">入住成功</h3>
          <p className="text-[#F5F0EB]/60 mb-4">欢迎光临，{res?.guestName || '尊贵客人'}</p>
          <div className="gradient-border p-4 inline-block">
            <p className="text-xs text-[#F5F0EB]/50">您的房间</p>
            <p className="text-4xl font-bold text-[#C9A96E] font-['Playfair_Display']">
              {checkInResult?.roomNumber || '---'}号房
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
