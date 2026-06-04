import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import ScoreMeter       from './ScoreMeter'
import ScoreBreakdown   from './ScoreBreakdown'
import ArticleMeta      from './ArticleMeta'
import ArticleHeatmap   from './ArticleHeatmap'
import ClaimCard        from './ClaimCard'
import BiasChart        from './BiasChart'
import FallacyPanel     from './FallacyPanel'
import SourcePanel      from './SourcePanel'
import ReportGenerator  from './ReportGenerator'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'claims',   label: 'Claims'   },
  { id: 'heatmap',  label: 'Heatmap'  },
  { id: 'bias',     label: 'Bias'     },
  { id: 'sources',  label: 'Sources'  },
]

export default function Results({ result, onReset }) {
  const [tab, setTab] = useState('overview')
  const navigate      = useNavigate()

  if (!result) return null

  const {
    article           = {},
    claims            = [],
    sentences         = [],
    article_topic     = '',
    article_type      = 'unknown',
    credibility_score = {},
    fact_check_summary= {},
    bias_analysis     = null,
    emotion_analysis  = null,
    heatmap_data      = [],
    fallacy_analysis  = null,
    pipeline          = {},
  } = result

  const score = credibility_score?.score ?? 0

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => { onReset?.(); navigate('/') }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Analyse another
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { onReset?.(); navigate('/analyze') }}
              className="btn-secondary text-xs py-2 px-4 gap-1.5"
            >
              <RefreshCw size={13} />
              New analysis
            </button>
            {/* Live PDF + copy buttons */}
            <ReportGenerator result={result} />
          </div>
        </div>

        {/* ── Hero score row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            <div className="shrink-0">
              <ScoreMeter
                score      ={score}
                band       ={credibility_score?.band}
                bandLabel  ={credibility_score?.band_label}
                emoji      ={credibility_score?.emoji}
                verdictText={credibility_score?.verdict_text}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-4 w-full">
              <ArticleMeta
                article     ={article}
                articleType ={article_type}
                articleTopic={article_topic}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Claims checked', value: claims.filter(c => c.fact_check?.verdict !== 'skipped').length },
                  { label: 'Sources found',  value: fact_check_summary.total_sources_found || 0 },
                  { label: 'Fallacies',      value: fallacy_analysis?.fallacy_count || 0 },
                  { label: 'Elapsed',        value: `${pipeline.elapsed_seconds || 0}s` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface rounded-xl p-3 border border-surface-border text-center">
                    <div className="font-display font-bold text-xl text-white">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl mb-6 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex-1 min-w-fit px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 select-none ${
                tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === id && (
                <motion.div
                  layoutId="results-tab-bg"
                  className="absolute inset-0 bg-surface-raised border border-surface-border rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab panels ── */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <ScoreBreakdown components={credibility_score?.components || {}} />
              <FallacyPanel   fallacyAnalysis={fallacy_analysis} />
            </div>
          )}

          {tab === 'claims' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">
                  {claims.length} claim{claims.length !== 1 ? 's' : ''} extracted and analysed
                </p>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-400">
                    ✓ {claims.filter(c => ['supported','likely_true'].includes(c.fact_check?.verdict)).length} supported
                  </span>
                  <span className="text-red-400">
                    ✗ {claims.filter(c => ['disputed','false'].includes(c.fact_check?.verdict)).length} disputed
                  </span>
                </div>
              </div>
              {claims.length === 0 && (
                <div className="card p-8 text-center text-gray-500">No claims were extracted.</div>
              )}
              {claims.map((claim, i) => (
                <ClaimCard key={claim.id || i} claim={claim} index={i} />
              ))}
            </div>
          )}

          {tab === 'heatmap' && (
            <ArticleHeatmap
              sentences  ={sentences}
              heatmapData={heatmap_data}
              fallacies  ={fallacy_analysis?.fallacies_found || []}
            />
          )}

          {tab === 'bias' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <BiasChart
                biasAnalysis   ={bias_analysis}
                emotionAnalysis={emotion_analysis}
              />
              {bias_analysis?.sentence_bias?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold text-base text-white mb-4">Sentence Bias Scores</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {bias_analysis.sentence_bias
                      .filter(s => s.bias_score > 15)
                      .slice(0, 20)
                      .map((s, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="w-6 text-gray-600 shrink-0 font-mono">{s.index + 1}</span>
                          <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${s.lean === 'left' ? 'bg-blue-500' : s.lean === 'right' ? 'bg-red-500' : 'bg-yellow-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${s.bias_score}%` }}
                              transition={{ duration: 0.5, delay: i * 0.03 }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-gray-500">{s.bias_score}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'sources' && (
            <SourcePanel
              claims          ={claims}
              factCheckSummary={fact_check_summary}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
