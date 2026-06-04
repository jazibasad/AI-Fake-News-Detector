import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const BAND_COLORS = {
  high:         { stroke: '#10b981', text: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)'  },
  moderate:     { stroke: '#15a87e', text: '#2dd4bf', bg: 'rgba(21,168,126,0.08)', border: 'rgba(21,168,126,0.2)'  },
  questionable: { stroke: '#eab308', text: '#fbbf24', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)'   },
  low:          { stroke: '#f97316', text: '#fb923c', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)'  },
  very_low:     { stroke: '#ef4444', text: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)'   },
}

const SIZE  = 220
const R     = 88
const CIRC  = 2 * Math.PI * R
const GAP   = 0.25   // 25% of circle cut at bottom

export default function ScoreMeter({ score, band, bandLabel, emoji, verdictText }) {
  const [displayed, setDisplayed] = useState(0)
  const colors = BAND_COLORS[band] || BAND_COLORS.questionable

  // Animate counter
  useEffect(() => {
    let frame
    let current = 0
    const target  = score ?? 0
    const step    = () => {
      current = Math.min(current + Math.ceil((target - current) / 8 + 0.5), target)
      setDisplayed(current)
      if (current < target) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [score])

  // Arc parameters — arc spans (1 - GAP) of full circle, starting bottom-left
  const arcFraction = 1 - GAP
  const startAngle  = Math.PI / 2 + (GAP / 2) * 2 * Math.PI
  const totalAngle  = arcFraction * 2 * Math.PI
  const fillAngle   = totalAngle * (displayed / 100)

  const polarToXY = (angle) => ({
    x: SIZE / 2 + R * Math.cos(angle),
    y: SIZE / 2 + R * Math.sin(angle),
  })

  const arcPath = (endAngle) => {
    const start  = polarToXY(startAngle)
    const end    = polarToXY(endAngle)
    const large  = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`
  }

  const bgEndAngle   = startAngle + totalAngle
  const fillEndAngle = startAngle + fillAngle

  return (
    <div className="flex flex-col items-center gap-5">
      {/* SVG meter */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="overflow-visible">
          {/* Track */}
          <path
            d={arcPath(bgEndAngle)}
            fill="none"
            stroke="#1f2a2a"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* Fill — animated via stroke-dashoffset */}
          <motion.path
            d={arcPath(bgEndAngle)}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${CIRC * arcFraction}`}
            initial={{ strokeDashoffset: CIRC * arcFraction }}
            animate={{ strokeDashoffset: CIRC * arcFraction * (1 - displayed / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${colors.stroke}88)` }}
          />
        </svg>

        {/* Centre content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-3xl">{emoji}</span>
          <span
            className="font-display font-extrabold text-5xl leading-none"
            style={{ color: colors.text }}
          >
            {displayed}
          </span>
          <span className="text-xs text-gray-500 font-mono">/ 100</span>
        </div>
      </div>

      {/* Band label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-2"
      >
        <span
          className="font-display font-bold text-lg px-4 py-1.5 rounded-full border"
          style={{ color: colors.text, background: colors.bg, borderColor: colors.border }}
        >
          {bandLabel}
        </span>
        <p className="text-xs text-gray-500 text-center max-w-[240px] leading-relaxed">
          {verdictText}
        </p>
      </motion.div>
    </div>
  )
}
