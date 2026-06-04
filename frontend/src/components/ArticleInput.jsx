import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, FileText, Zap, X, AlertCircle } from 'lucide-react'

const MAX_CHARS = 20000

export default function ArticleInput({ onSubmit, compact = false }) {
  const [tab, setTab]     = useState('url')
  const [url, setUrl]     = useState('')
  const [text, setText]   = useState('')
  const [error, setError] = useState('')
  const textRef           = useRef(null)

  const isUrlValid = (v) => { try { new URL(v); return true } catch { return false } }

  const canSubmit = tab === 'url'
    ? url.trim().length > 0 && isUrlValid(url.trim())
    : text.trim().length > 100

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    const payload = tab === 'url'
      ? { type: 'url',  value: url.trim()  }
      : { type: 'text', value: text.trim() }

    if (onSubmit) {
      onSubmit(payload)
    } else {
      // Fallback: store and navigate (used from Home page)
      sessionStorage.setItem('tl_input', JSON.stringify(payload))
      window.location.href = '/analyze'
    }
  }

  const charPct = Math.min((text.length / MAX_CHARS) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card glow-brand-sm ${compact ? 'p-6' : 'p-8'} w-full`}
    >
      {!compact && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl text-white mb-1">
            Paste an article or enter a URL
          </h2>
          <p className="text-sm text-gray-500">
            AI will extract claims, cross-reference sources, and score credibility in seconds.
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-5 w-fit">
        {[
          { id: 'url',   label: 'URL',           icon: Link2    },
          { id: 'paste', label: 'Paste Article',  icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError('') }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none ${
              tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-surface-raised border border-surface-border rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={14} />
              {label}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {tab === 'url' ? (
            <motion.div
              key="url-input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Link2 size={16} className="text-gray-500" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  placeholder="https://www.example.com/article/..."
                  className="input-field pl-11 pr-10"
                  autoFocus
                />
                {url && (
                  <button type="button" onClick={() => setUrl('')}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-300 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Supports any publicly accessible news article URL
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="paste-input"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <textarea
                ref={textRef}
                value={text}
                onChange={e => { setText(e.target.value.slice(0, MAX_CHARS)); setError('') }}
                placeholder="Paste the full article text here…"
                rows={compact ? 6 : 8}
                className="input-field resize-none font-body text-sm leading-relaxed"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className={`text-xs font-mono ${text.length > MAX_CHARS * 0.9 ? 'text-yellow-500' : 'text-gray-600'}`}>
                  {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-0.5 bg-surface-raised rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-300 ${charPct > 90 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                  animate={{ width: `${charPct}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
            >
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-display font-semibold text-sm transition-all duration-200 select-none ${
            canSubmit
              ? 'bg-brand-500 hover:bg-brand-400 text-white hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-surface-raised text-gray-600 cursor-not-allowed'
          }`}
          style={canSubmit ? { boxShadow: '0 4px 20px rgba(21,168,126,0.3)' } : {}}
        >
          <Zap size={16} />
          Analyze Now
        </button>

        <p className="text-center text-xs text-gray-600">
          Analysis runs locally on your machine — no data leaves your device.
        </p>
      </form>
    </motion.div>
  )
}
