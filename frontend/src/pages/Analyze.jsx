import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import ArticleInput   from '../components/ArticleInput'
import AnalysisLoader from '../components/AnalysisLoader'
import Results        from '../components/Results'
import { useAnalysis } from '../hooks/useAnalysis'

export default function Analyze() {
  const navigate = useNavigate()
  const { status, result, error, stage, progress, analyse, reset } = useAnalysis()

  // If arriving from Home page with a saved input, auto-start
  useEffect(() => {
    const stored = sessionStorage.getItem('tl_input')
    if (stored) {
      sessionStorage.removeItem('tl_input')
      try {
        const parsed = JSON.parse(stored)
        analyse(parsed)
      } catch (_) {}
    }
  }, [])

  // ── Loading state ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen pt-16">
        <AnalysisLoader stage={stage} progress={progress} />
      </div>
    )
  }

  // ── Results state ──
  if (status === 'success' && result) {
    return <Results result={result} onReset={reset} />
  }

  // ── Idle / error state ──
  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-2xl mx-auto">

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 mb-8 transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          Back to home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-3xl text-white mb-2">Analyze Article</h1>
          <p className="text-gray-500">Paste article text or enter a URL to begin fact-checking.</p>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-sm text-red-300"
          >
            <strong className="block mb-1">Analysis failed</strong>
            {error}
          </motion.div>
        )}

        <ArticleInput onSubmit={analyse} compact={false} />
      </div>
    </div>
  )
}
