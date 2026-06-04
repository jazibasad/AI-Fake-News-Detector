import { motion } from 'framer-motion'

const fakeLines = [
  { w: '80%', col: 'bg-gray-700' },
  { w: '65%', col: 'bg-gray-700' },
  { w: '90%', col: 'bg-gray-700' },
  { w: '55%', col: 'bg-gray-700' },
  { w: '75%', col: 'bg-gray-700' },
  { w: '45%', col: 'bg-red-800/60' },
  { w: '70%', col: 'bg-gray-700' },
  { w: '85%', col: 'bg-yellow-800/50' },
  { w: '60%', col: 'bg-gray-700' },
  { w: '78%', col: 'bg-gray-700' },
]

export default function ScanAnimation() {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      {/* Article card mock */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="card p-5 relative overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-gray-700" />
          <div className="h-3 w-32 bg-gray-700 rounded-full" />
          <div className="ml-auto h-3 w-12 bg-gray-800 rounded-full" />
        </div>

        {/* Title mock */}
        <div className="h-4 w-full bg-gray-600 rounded-full mb-1.5" />
        <div className="h-4 w-3/4 bg-gray-600 rounded-full mb-4" />

        {/* Lines */}
        {fakeLines.map((line, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div
              className={`h-2 rounded-full ${line.col}`}
              style={{ width: line.w }}
            />
          </div>
        ))}

        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-brand-400/60 pointer-events-none"
          style={{ boxShadow: '0 0 12px 2px rgba(21,168,126,0.4)' }}
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Overlay tint */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-brand-900/5 to-transparent" />
      </motion.div>

      {/* Score badge floating */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute -right-4 -bottom-4 glass rounded-xl px-4 py-3 border border-brand-700/40 glow-brand-sm"
      >
        <div className="text-xs text-gray-500 mb-0.5">Credibility</div>
        <div className="font-display font-bold text-xl text-brand-400">72 / 100</div>
      </motion.div>

      {/* Bias tag floating */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="absolute -left-6 top-8 glass rounded-lg px-3 py-2 border border-yellow-700/30 text-xs text-yellow-400"
      >
        ⚠ Bias detected
      </motion.div>
    </div>
  )
}
