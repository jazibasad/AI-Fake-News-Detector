import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Zap, Brain, BarChart2, Globe, FileOutput,
  CheckCircle, ArrowRight, Cpu, Database, FlaskConical
} from 'lucide-react'
import ArticleInput from '../components/ArticleInput'
import FeatureCard   from '../components/FeatureCard'
import StatBadge     from '../components/StatBadge'
import ScanAnimation from '../components/ScanAnimation'

const features = [
  { icon: Brain,       title: 'AI Claim Extraction',     description: 'Local Mistral AI automatically isolates every factual claim in the article and prepares them for cross-referencing.',        color: 'brand',  delay: 0    },
  { icon: Globe,       title: 'Real-Time Cross-Reference',description: 'Claims are checked against GDELT and The Guardian Open API — two unlimited, free news databases spanning the globe.',      color: 'blue',   delay: 0.05 },
  { icon: BarChart2,   title: 'Credibility Score 0–100',  description: 'A composite score weighs claim verification rate, source diversity, bias signals, and logical fallacy count.',             color: 'brand',  delay: 0.1  },
  { icon: Zap,         title: 'Sentence-Level Heatmap',   description: 'Every sentence is colour-coded from calm informational text to emotionally manipulative or misleading language.',          color: 'yellow', delay: 0.15 },
  { icon: Shield,      title: 'Bias & Fallacy Detector',  description: 'spaCy NLP flags 12 types of logical fallacy and scores ideological lean using a curated bias-signals dictionary.',        color: 'red',    delay: 0.2  },
  { icon: FileOutput,  title: 'Shareable PDF Report',     description: 'Generate a full credibility report as a downloadable PDF or shareable image card — no account or login required.',        color: 'purple', delay: 0.25 },
]

const steps = [
  { icon: FileOutput, label: 'Input article',    desc: 'Paste text or drop a URL'           },
  { icon: Cpu,        label: 'AI extraction',    desc: 'Mistral pulls key claims locally'   },
  { icon: Database,   label: 'Cross-reference',  desc: 'GDELT + Guardian verify claims'     },
  { icon: FlaskConical,label:'Bias analysis',    desc: 'spaCy NLP scores language tone'     },
  { icon: BarChart2,  label: 'Score generated',  desc: 'Composite credibility 0–100'        },
  { icon: Shield,     label: 'Report ready',     desc: 'View, share, or download'           },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="noise-bg">
      {/* ─── HERO ──────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">

        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-700/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-20 w-[300px] h-[300px] bg-blue-700/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="section-tag mb-6 inline-flex"
            >
              <Shield size={12} />
              AI-powered media intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-display font-extrabold text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6"
            >
              <span className="text-white">Don't share</span>
              <br />
              <span className="text-gradient">misinformation.</span>
              <br />
              <span className="text-white">Verify it first.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg"
            >
              TruthLens uses open-source AI running entirely on your machine to extract claims,
              cross-reference news databases, detect emotional manipulation, and score every article
              for credibility — in seconds. Zero cost. Zero data shared.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <button onClick={() => navigate('/analyze')} className="btn-primary">
                <Zap size={16} />
                Analyze an Article
                <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('/about')} className="btn-secondary">
                How it works
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 text-xs text-gray-600"
            >
              {['100% free forever', 'Runs offline (AI is local)', 'No account needed', 'Open source'].map((b) => (
                <span key={b} className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-brand-500" />
                  {b}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: scan animation + quick input */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <ScanAnimation />
          </motion.div>
        </div>
      </section>

      {/* ─── QUICK INPUT ───────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <ArticleInput compact={false} />
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────── */}
      <section className="px-6 py-12 border-y border-surface-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBadge value="7"    label="Analysis modules"  delay={0}    />
          <StatBadge value="0$"   label="Cost forever"      delay={0.05} />
          <StatBadge value="100%" label="Runs offline"      delay={0.1}  />
          <StatBadge value="<15s" label="Per analysis"      delay={0.15} />
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-tag mb-4 inline-flex"
            >
              What it does
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-display font-bold text-4xl text-white"
            >
              Every tool you need to spot fake news
            </motion.h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────── */}
      <section className="px-6 py-20 bg-surface-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-tag mb-4 inline-flex">Process</div>
            <h2 className="font-display font-bold text-4xl text-white">
              From article to verdict in 6 steps
            </h2>
          </div>

          <div className="relative">
            {/* connector line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-surface-border z-0" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
              {steps.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="w-16 h-16 rounded-2xl card flex items-center justify-center border-brand-700/20">
                    <Icon size={22} className="text-brand-400" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm text-white mb-0.5">{label}</div>
                    <div className="text-xs text-gray-600">{desc}</div>
                  </div>
                  <div className="text-xs font-mono text-gray-700">0{i + 1}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-4xl text-white mb-4">
              Ready to fact-check?
            </h2>
            <p className="text-gray-500 mb-8">
              No signup. No API key. No cost. Just paste an article and get the truth.
            </p>
            <button onClick={() => navigate('/analyze')} className="btn-primary text-base px-8 py-4">
              <Zap size={18} />
              Start Analyzing
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────── */}
      <footer className="border-t border-surface-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-brand-500" />
            <span className="font-display font-semibold text-gray-400">TruthLens</span>
            <span>— AI Fake News Detector</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Open Source</a>
            <a href="#" className="hover:text-gray-300 transition-colors">GitHub</a>
          </div>
          <div>Built with Ollama · GDELT · spaCy · React</div>
        </div>
      </footer>
    </div>
  )
}
