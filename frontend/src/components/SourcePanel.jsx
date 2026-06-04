import { motion } from 'framer-motion'
import { ExternalLink, Shield, AlertCircle, Globe } from 'lucide-react'

const TIER_STYLE = {
  trusted_high:    { label: 'Highly Trusted',    color: 'text-green-400',  bg: 'bg-green-900/15',  border: 'border-green-700/25'  },
  trusted_medium:  { label: 'Generally Trusted', color: 'text-teal-400',   bg: 'bg-teal-900/15',   border: 'border-teal-700/25'   },
  unknown:         { label: 'Unknown',            color: 'text-gray-400',   bg: 'bg-gray-900/15',   border: 'border-gray-700/25'   },
  satire:          { label: 'Satire',             color: 'text-purple-400', bg: 'bg-purple-900/15', border: 'border-purple-700/25' },
  low_credibility: { label: 'Low Credibility',    color: 'text-red-400',    bg: 'bg-red-900/15',    border: 'border-red-700/25'    },
}

const TRUSTED_SUGGESTIONS = [
  { name: 'Reuters',       url: 'https://reuters.com',      desc: 'Global news agency'         },
  { name: 'AP News',       url: 'https://apnews.com',       desc: 'Associated Press'           },
  { name: 'BBC News',      url: 'https://bbc.com/news',     desc: 'UK public broadcaster'      },
  { name: 'The Guardian',  url: 'https://theguardian.com',  desc: 'Independent journalism'     },
  { name: 'NPR',           url: 'https://npr.org',          desc: 'US public radio'            },
]

export default function SourcePanel({ claims = [], factCheckSummary = {} }) {
  // Collect all sources from claims
  const allSources = []
  const seenUrls = new Set()

  claims.forEach(claim => {
    const sources = claim.fact_check?.top_sources || []
    sources.forEach(src => {
      if (src.url && !seenUrls.has(src.url)) {
        seenUrls.add(src.url)
        allSources.push({
          ...src,
          credibility: src.credibility || { tier: 'unknown', label: 'Unknown', score: 50 },
        })
      }
    })
  })

  // Sort by credibility score
  allSources.sort((a, b) => (b.credibility?.score || 0) - (a.credibility?.score || 0))

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-white">Source Analysis</h3>
        <span className="text-xs text-gray-500 font-mono">
          {factCheckSummary.total_sources_found || 0} sources found
        </span>
      </div>

      {/* Summary */}
      {factCheckSummary.summary && (
        <p className="text-xs text-gray-500 leading-relaxed bg-surface rounded-lg px-4 py-3 border border-surface-border">
          {factCheckSummary.summary}
        </p>
      )}

      {/* Verification rate bar */}
      {factCheckSummary.overall_verification_rate != null && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Claim verification rate</span>
            <span className="font-mono text-gray-300">{factCheckSummary.overall_verification_rate}%</span>
          </div>
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
              initial={{ width: 0 }}
              animate={{ width: `${factCheckSummary.overall_verification_rate}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Found sources */}
      {allSources.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Articles found ({allSources.length})
          </p>
          <div className="space-y-2">
            {allSources.slice(0, 8).map((src, i) => {
              const tier  = src.credibility?.tier || 'unknown'
              const style = TIER_STYLE[tier] || TIER_STYLE.unknown
              return (
                <motion.a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:brightness-110 group ${style.bg} ${style.border}`}
                >
                  <Globe size={13} className={`${style.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 line-clamp-1 group-hover:text-white transition-colors">
                      {src.title || src.domain}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{src.domain}</span>
                      <span className={`text-xs ${style.color}`}>· {style.label}</span>
                      {src.date && <span className="text-xs text-gray-700">{src.date}</span>}
                    </div>
                  </div>
                  <ExternalLink size={11} className="text-gray-700 group-hover:text-brand-400 transition-colors shrink-0 mt-0.5" />
                </motion.a>
              )
            })}
          </div>
        </div>
      )}

      {/* Trusted source suggestions */}
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
          <Shield size={11} className="inline mr-1.5 text-brand-500" />
          Suggested verified sources
        </p>
        <div className="flex flex-wrap gap-2">
          {TRUSTED_SUGGESTIONS.map(({ name, url, desc }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={desc}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-900/20 border border-brand-700/25 text-brand-400 hover:bg-brand-900/35 transition-colors"
            >
              {name}
            </a>
          ))}
        </div>
      </div>

      {allSources.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-surface-border">
          <AlertCircle size={16} className="text-gray-500 shrink-0" />
          <p className="text-xs text-gray-500">
            No corroborating articles found. This may mean the story is very recent, highly localised, or unverifiable through open databases.
          </p>
        </div>
      )}
    </div>
  )
}
