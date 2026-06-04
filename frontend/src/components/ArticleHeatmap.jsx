import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

const TIER_STYLES = {
  manipulative:       { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.4)',   label: 'Manipulative',        dot: 'bg-red-500'    },
  highly_emotional:   { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.35)', label: 'Highly Emotional',    dot: 'bg-orange-500' },
  emotional:          { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)',   label: 'Emotional',           dot: 'bg-yellow-500' },
  slightly_emotional: { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)', label: 'Slightly Opinionated',dot: 'bg-blue-500'   },
  neutral:            { bg: 'transparent',             border: 'transparent',           label: 'Neutral',             dot: 'bg-gray-600'   },
}

export default function ArticleHeatmap({ sentences, heatmapData, fallacies = [] }) {
  const [tooltip, setTooltip] = useState(null)  // { index, text, tier, tooltip }
  const [showLegend, setShowLegend] = useState(false)

  if (!sentences?.length || !heatmapData?.length) {
    return (
      <div className="card p-6 text-center text-gray-500 text-sm">
        No heatmap data available.
      </div>
    )
  }

  // Map sentence index → heatmap entry
  const heatMap = {}
  heatmapData.forEach(h => { heatMap[h.index] = h })

  // Fallacy sentence indices
  const fallacySet = new Set((fallacies || []).map(f => f.sentence_index))

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-base text-white">
          Article Heatmap
        </h3>
        <button
          onClick={() => setShowLegend(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Info size={13} />
          Legend
        </button>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex flex-wrap gap-3 p-3 bg-surface rounded-lg border border-surface-border text-xs">
              {Object.entries(TIER_STYLES).map(([tier, style]) => (
                <span key={tier} className="flex items-center gap-1.5 text-gray-400">
                  <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 opacity-70" />
                Fallacy detected
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentences */}
      <div className="space-y-1 relative">
        {sentences.map((sentence, i) => {
          const heat   = heatMap[i]
          const tier   = heat?.tier || 'neutral'
          const style  = TIER_STYLES[tier] || TIER_STYLES.neutral
          const hasFallacy = fallacySet.has(i)
          const isActive   = tooltip?.index === i

          return (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.8) }}
              onMouseEnter={() => heat && setTooltip({ index: i, ...heat })}
              onMouseLeave={() => setTooltip(null)}
              className="inline relative cursor-default transition-all duration-150 leading-7"
              style={{
                backgroundColor: isActive
                  ? style.border
                  : style.bg,
                borderBottom: hasFallacy
                  ? '2px solid rgba(168,85,247,0.7)'
                  : tier !== 'neutral'
                  ? `1px solid ${style.border}`
                  : 'none',
                borderRadius: '3px',
                padding: '1px 2px',
              }}
            >
              {sentence}{' '}
              {/* Tooltip */}
              {isActive && heat && (
                <span
                  className="absolute z-20 bottom-full left-0 mb-2 w-64 p-3 rounded-xl text-xs text-gray-100 leading-relaxed pointer-events-none"
                  style={{
                    background: 'rgba(19,24,22,0.98)',
                    border: `1px solid ${style.border}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <span className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <strong>{style.label}</strong>
                  </span>
                  <span className="text-gray-400 block">{heat.tooltip}</span>
                  {heat.manipulation_score > 0 && (
                    <span className="text-orange-400 block mt-1">
                      Manipulation signal: {heat.manipulation_score}/100
                    </span>
                  )}
                  {hasFallacy && (
                    <span className="text-purple-400 block mt-1">
                      ⚠ Logical fallacy detected in this sentence
                    </span>
                  )}
                </span>
              )}
            </motion.span>
          )
        })}
      </div>

      {/* Stats bar */}
      <div className="mt-5 pt-4 border-t border-surface-border flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(TIER_STYLES).filter(([t]) => t !== 'neutral').map(([tier, style]) => {
          const count = heatmapData.filter(h => h.tier === tier).length
          if (!count) return null
          return (
            <span key={tier} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {count} {style.label.toLowerCase()}
            </span>
          )
        })}
      </div>
    </div>
  )
}
