import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell
} from 'recharts'

const DIRECTION_CONFIG = {
  neutral: { label: 'Neutral',      color: '#10b981', bar: 'bg-green-500'  },
  left:    { label: 'Leans Left',   color: '#3b82f6', bar: 'bg-blue-500'   },
  right:   { label: 'Leans Right',  color: '#ef4444', bar: 'bg-red-500'    },
  mixed:   { label: 'Mixed',        color: '#eab308', bar: 'bg-yellow-500' },
  loaded:  { label: 'Loaded Language', color: '#f97316', bar: 'bg-orange-500'},
}

export default function BiasChart({ biasAnalysis, emotionAnalysis }) {
  if (!biasAnalysis) return null

  const {
    bias_score      = 0,
    neutrality_score= 100,
    bias_direction  = 'neutral',
    political_lean  = 'Neutral',
    subjectivity    = 0,
    loaded_language = [],
    left_signals    = 0,
    right_signals   = 0,
    loaded_count    = 0,
    hedge_ratio     = 0,
    certainty_ratio = 0,
  } = biasAnalysis

  const {
    avg_intensity   = 0,
    avg_manipulation= 0,
    emotion_distribution = {},
  } = emotionAnalysis || {}

  const dirCfg = DIRECTION_CONFIG[bias_direction] || DIRECTION_CONFIG.neutral

  // Radar data
  const radarData = [
    { metric: 'Neutrality',     value: Math.round(neutrality_score) },
    { metric: 'Objectivity',    value: Math.round((1 - subjectivity) * 100) },
    { metric: 'Hedge Language', value: Math.min(Math.round(hedge_ratio * 10), 100) },
    { metric: 'Low Emotion',    value: Math.max(0, 100 - Math.round(avg_intensity)) },
    { metric: 'Low Manip.',     value: Math.max(0, 100 - Math.round(avg_manipulation)) },
    { metric: 'Source Cover.',  value: 60 },  // placeholder shown until real data
  ]

  // Emotion bar data
  const emotionBars = Object.entries(emotion_distribution)
    .filter(([k]) => k !== 'neutral')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))

  const EMOTION_COLORS = {
    Fear: '#ef4444', Anger: '#f97316', Disgust: '#a855f7',
    Excitement: '#eab308', Sadness: '#3b82f6',
  }

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-display font-semibold text-base text-white">Bias & Language Analysis</h3>

      {/* Top summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Bias Score',   value: `${Math.round(bias_score)}/100`,      color: dirCfg.color },
          { label: 'Lean',         value: political_lean,                         color: dirCfg.color },
          { label: 'Neutrality',   value: `${Math.round(neutrality_score)}%`,    color: '#10b981'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl p-3 text-center border border-surface-border">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="font-display font-bold text-sm" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Radar chart */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Quality dimensions</p>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#263030" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Sans' }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke={dirCfg.color}
              fill={dirCfg.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Emotion distribution */}
      {emotionBars.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Emotion distribution</p>
          <div className="space-y-2">
            {emotionBars.map(({ name, count }) => {
              const maxCount = Math.max(...emotionBars.map(e => e.count))
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-400 shrink-0">{name}</span>
                  <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: EMOTION_COLORS[name] || '#6b7280' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-6 text-gray-600 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Loaded language */}
      {loaded_language.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
            Loaded language detected ({loaded_count})
          </p>
          <div className="flex flex-wrap gap-2">
            {loaded_language.slice(0, 8).map(phrase => (
              <span
                key={phrase}
                className="text-xs px-2.5 py-1 rounded-lg bg-orange-900/20 border border-orange-700/25 text-orange-400"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signal counts */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-border">
        <div className="text-xs text-gray-500">
          <span className="text-blue-400 font-medium">{left_signals}</span> left-lean signals
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-red-400 font-medium">{right_signals}</span> right-lean signals
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-yellow-400 font-medium">{Math.round(avg_intensity)}/100</span> avg emotion intensity
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-orange-400 font-medium">{Math.round(avg_manipulation)}/100</span> avg manipulation
        </div>
      </div>
    </div>
  )
}
