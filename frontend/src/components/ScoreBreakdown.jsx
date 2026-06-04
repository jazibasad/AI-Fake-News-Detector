import { motion } from 'framer-motion'

const COMPONENT_ICONS = {
  verification_rate:  '🔍',
  source_quality:     '📰',
  bias_severity:      '⚖️',
  fallacy_count:      '🧠',
  article_metadata:   '📋',
}

export default function ScoreBreakdown({ components = {} }) {
  if (!Object.keys(components).length) return null

  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-base text-white mb-4">Score Breakdown</h3>
      <div className="space-y-4">
        {Object.entries(components).map(([key, comp], i) => {
          const pct    = Math.round(comp.score)
          const weight = Math.round(comp.weight * 100)
          const color  = pct >= 70 ? '#10b981' : pct >= 45 ? '#eab308' : '#ef4444'

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{COMPONENT_ICONS[key] || '•'}</span>
                  <span className="text-xs font-medium text-gray-300">{comp.label}</span>
                  <span className="text-xs text-gray-600 font-mono">×{weight}%</span>
                </div>
                <span className="text-xs font-mono font-bold" style={{ color }}>
                  {pct}/100
                </span>
              </div>

              {/* Bar */}
              <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.07 + 0.2 }}
                />
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">{comp.detail}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
