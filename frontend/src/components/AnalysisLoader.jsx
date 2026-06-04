import { motion } from 'framer-motion'
import { Brain, Globe, BarChart2, Shield, Zap, FileText, Loader2 } from 'lucide-react'

const STAGES = [
  { key: 'scraping',           label: 'Fetching article...',          icon: FileText,  color: 'text-blue-400'   },
  { key: 'claim_extraction',   label: 'Extracting claims with AI...', icon: Brain,     color: 'text-brand-400'  },
  { key: 'fact_checking',      label: 'Cross-referencing sources...', icon: Globe,     color: 'text-purple-400' },
  { key: 'emotion_analysis',   label: 'Analysing tone & emotion...',  icon: Zap,       color: 'text-yellow-400' },
  { key: 'bias_detection',     label: 'Detecting bias signals...',    icon: Shield,    color: 'text-orange-400' },
  { key: 'fallacy_detection',  label: 'Checking logical fallacies...', icon: Brain,    color: 'text-red-400'    },
  { key: 'credibility_scoring',label: 'Scoring credibility...',       icon: BarChart2, color: 'text-brand-400'  },
]

export default function AnalysisLoader({ stage = '', progress = 0 }) {
  const currentIdx = STAGES.findIndex(s => s.label === stage)

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 px-6">

      {/* Spinner */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-surface-border" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-brand-700/40 border-b-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={30} className="text-brand-400 animate-spin" />
        </div>
      </div>

      {/* Stage label */}
      <div className="text-center">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-semibold text-lg text-white mb-1"
        >
          {stage || 'Starting analysis…'}
        </motion.p>
        <p className="text-sm text-gray-500">This takes 15–60 seconds depending on article length</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>Progress</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stage steps */}
      <div className="w-full max-w-sm space-y-2.5">
        {STAGES.map(({ label, icon: Icon, color }, i) => {
          const done    = i < currentIdx
          const current = i === currentIdx
          const pending = i > currentIdx
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                current ? color : done ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {done ? (
                <span className="text-brand-400 text-base leading-none">✓</span>
              ) : current ? (
                <Loader2 size={14} className={`animate-spin ${color}`} />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-gray-700 inline-block shrink-0" />
              )}
              <Icon size={13} className="shrink-0" />
              {label}
            </motion.div>
          )
        })}
      </div>

      <p className="text-xs text-gray-700 text-center max-w-xs">
        AI analysis runs locally on your machine via Ollama — no data is sent to any external server.
      </p>
    </div>
  )
}
