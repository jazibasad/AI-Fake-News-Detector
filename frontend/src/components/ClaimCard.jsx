import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ExternalLink, CheckCircle, XCircle, AlertCircle, HelpCircle, MinusCircle } from 'lucide-react'

const VERDICT_CONFIG = {
  supported:          { icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-700/30',  label: 'Supported'           },
  likely_true:        { icon: CheckCircle,  color: 'text-teal-400',   bg: 'bg-teal-900/20',   border: 'border-teal-700/30',   label: 'Likely True'         },
  partially_verified: { icon: AlertCircle,  color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/30', label: 'Partially Verified'  },
  unverified:         { icon: HelpCircle,   color: 'text-gray-400',   bg: 'bg-gray-900/20',   border: 'border-gray-700/30',   label: 'Unverified'          },
  disputed:           { icon: AlertCircle,  color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/30', label: 'Disputed'            },
  false:              { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-700/30',    label: 'False'               },
  skipped:            { icon: MinusCircle,  color: 'text-gray-600',   bg: 'bg-gray-900/10',   border: 'border-gray-800/20',   label: 'Skipped'             },
}

const IMPORTANCE_BADGE = {
  high:   'bg-red-900/30 text-red-400 border border-red-800/30',
  medium: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30',
  low:    'bg-gray-800 text-gray-500 border border-gray-700/30',
}

const TYPE_BADGE = {
  statistic:  'bg-blue-900/30 text-blue-400',
  event:      'bg-purple-900/30 text-purple-400',
  accusation: 'bg-red-900/30 text-red-400',
  quote:      'bg-teal-900/30 text-teal-400',
  fact:       'bg-brand-900/30 text-brand-400',
  figure:     'bg-indigo-900/30 text-indigo-400',
}

export default function ClaimCard({ claim, index }) {
  const [expanded, setExpanded] = useState(false)

  const fc         = claim.fact_check || {}
  const verdict    = fc.verdict || 'unverified'
  const cfg        = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.unverified
  const VerdictIcon= cfg.icon
  const sources    = fc.top_sources || []
  const coverage   = fc.coverage   || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${cfg.bg} ${cfg.border}`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:brightness-110 transition-all"
      >
        {/* Verdict icon */}
        <VerdictIcon size={18} className={`${cfg.color} mt-0.5 shrink-0`} />

        {/* Claim text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed line-clamp-2">{claim.text}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
              {cfg.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${IMPORTANCE_BADGE[claim.importance] || IMPORTANCE_BADGE.medium}`}>
              {claim.importance}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[claim.type] || TYPE_BADGE.fact}`}>
              {claim.type}
            </span>
            {sources.length > 0 && (
              <span className="text-xs text-gray-500">{sources.length} source{sources.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-sm font-display font-bold ${cfg.color}`}>
            {fc.confidence || 0}%
          </span>
          <div className="w-16 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${cfg.color.replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${fc.confidence || 0}%` }}
              transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
            />
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`text-gray-600 shrink-0 mt-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">

              {/* Coverage */}
              {coverage.label && (
                <div className="text-xs text-gray-500">
                  <span className="text-gray-400 font-medium">Coverage: </span>
                  {coverage.label} — {coverage.count || 0} article{(coverage.count || 0) !== 1 ? 's' : ''} found
                  {coverage.trusted_count > 0 && `, ${coverage.trusted_count} from trusted outlets`}
                </div>
              )}

              {/* Keywords */}
              {claim.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {claim.keywords.map(kw => (
                    <span key={kw} className="text-xs bg-surface-raised border border-surface-border text-gray-400 px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-400">Related sources:</p>
                  {sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 group text-xs text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      <ExternalLink size={11} className="mt-0.5 shrink-0 text-gray-600 group-hover:text-brand-400" />
                      <span className="line-clamp-1">{src.title || src.domain}</span>
                      <span className="ml-auto shrink-0 text-gray-700">{src.domain}</span>
                    </a>
                  ))}
                </div>
              )}

              {verdict === 'unverified' && (
                <p className="text-xs text-gray-600 italic">
                  No matching articles found in GDELT or Guardian databases. This doesn't mean the claim is false.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
