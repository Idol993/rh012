import { useEffect, useState, type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  change?: number
  icon: ReactNode
  color?: string
  prefix?: string
  suffix?: string
}

export default function KPICard({ title, value, change, icon, color = '#C9A96E', prefix = '', suffix = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const duration = 1200
    const stepTime = 20
    const steps = duration / stepTime
    const increment = end / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [value])

  const isPositive = change !== undefined && change >= 0

  return (
    <div className="gradient-border p-5 flex flex-col gap-3 transition-transform hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#F5F0EB]/60">{title}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#F5F0EB]" style={{ fontFamily: "'Playfair Display', serif" }}>
          {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
        {change !== undefined && (
          <span className={`flex items-center text-sm mb-1 ${isPositive ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  )
}
