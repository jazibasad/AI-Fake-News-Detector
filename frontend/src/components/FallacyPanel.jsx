import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'

const SEVERITY_STYLE = {
  high:   { pill: 'bg-red-900/25 text-red-400 border-red-700/30',    dot: 'bg-red-500'    },
  medium: { pill: 'bg-orange-900/25 text-orange-400 border-orange-700/30', dot: 'bg-orange-500' },
  low:    { pill: 'bg-yellow-900/25 text-yellow-400 border-yellow-700/30', dot: 'bg-yellow-500' },
}

export default function FallacyPanel({ fallacyAnalysis }) {
  if (!fallacyAnalysis) return null

  const {
    fallacies_found  = [],
    fallacy_count    = 0,
    severity_score   = 0,
    summary          = '',
  } = fallacyAnalysis

  // Group by fallacy type
  const grouped = {}
  fallacies_found.forEach(f => {
    if (!grouped[f.fallacy_id]) {
      grouped[f.fallacy_id] = { ...f, occurrences: [] }
    }
    grouped[f.fallacy_id].occurrences.push(f.sentence_text)
  })

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-base text-white">Logical Fallacies</h3>
        <span className={`text-xs font-mono px-2 py-1 rounded-lg border ${
          fallacy_count === 0
            ? 'bg-green-900/20 text-green-400 border-green-700/30'
            : severity_score > 40
            ? 'bg-red-900/20 text-red-400 border-red-700/30'
            : 'bg-yellow-900/20 text-yellow-400 border-yellow-700/30'
        }`}>
          {fallacy_count} detected
        </span>
      </div>

      {fallacy_count === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-green-900/10 border border-green-700/20 rounded-xl">
          <CheckCircle size={18} className="text-green-400 shrink-0" />
          <div>
            <p className="text-sm text-green-300 font-medium">No fallacies detected</p>
            <p className="text-xs text-gray-500 mt-0.5">The article's arguments appear logically sound.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Severity bar */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-gray-500 shrink-0">Severity</span>
            <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(severity_score, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 shrink-0">{Math.round(severity_score)}/100</span>
          </div>

          {Object.values(grouped).map((fallacy, i) => {
            const style = SEVERITY_STYLE[fallacy.severity] || SEVERITY_STYLE.medium
            return (
              <motion.div
                key={fallacy.fallacy_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-surface-raised border border-surface-border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={15} className="text-orange-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-semibold text-sm text-white">
                        {fallacy.fallacy_name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${style.pill}`}>
                        {fallacy.severity}
                      </span>
                      {fallacy.occurrences.length > 1 && (
                        <span className="text-xs text-gray-600">×{fallacy.occurrences.length}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{fallacy.description}</p>
                    {/* Example sentence */}
                    <blockquote className="text-xs text-gray-400 italic border-l-2 border-surface-border pl-3 line-clamp-2">
                      "{fallacy.occurrences[0]}"
                    </blockquote>
                  </div>
                </div>
              </motion.div>
            )
          })}

          <p className="text-xs text-gray-600 pt-1">{summary}</p>
        </div>
      )}
    </div>
  )
}
