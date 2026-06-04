import { motion } from 'framer-motion'
import { Shield, Cpu, Globe, Database, FlaskConical, BarChart2, FileOutput } from 'lucide-react'

const techStack = [
  { icon: Cpu,         name: 'Ollama + Mistral 7B',    desc: 'Local AI model — runs on your PC, no internet required for AI analysis. 100% free, no API key.',         color: 'text-brand-400'  },
  { icon: Globe,       name: 'GDELT Project API',       desc: 'A completely free, key-less database of billions of news events worldwide. Unlimited requests.',           color: 'text-blue-400'   },
  { icon: Database,    name: 'Guardian Open API',       desc: 'The Guardian\'s free developer API. No payment, instant key, no usage limits for non-commercial use.',     color: 'text-purple-400' },
  { icon: FlaskConical,name: 'spaCy + NLTK + TextBlob', desc: 'Open-source Python NLP libraries for bias detection, logical fallacy analysis, and sentiment scoring.',   color: 'text-yellow-400' },
  { icon: BarChart2,   name: 'React + Recharts',        desc: 'Fast, modern frontend with beautiful interactive charts. All open-source, MIT licensed.',                 color: 'text-pink-400'   },
  { icon: FileOutput,  name: 'jsPDF + html2canvas',     desc: 'Generate professional PDF credibility reports entirely client-side — no server upload needed.',           color: 'text-orange-400' },
]

export default function About() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-brand-400 text-xs font-mono font-medium tracking-widest uppercase px-3 py-1 rounded-full bg-brand-900/30 border border-brand-700/30 mb-6">
            About TruthLens
          </div>
          <h1 className="font-display font-bold text-5xl text-white mb-5">
            Built to be free.<br />
            <span className="text-gradient">Forever.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            TruthLens was designed from day one with a strict constraint: every tool, every API,
            every library must be completely free with no trial, no credit card, and no usage cap.
            Your analysis runs locally on your machine.
          </p>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-16"
        >
          <h2 className="font-display font-bold text-2xl text-white mb-8 text-center">
            The stack — verified free
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {techStack.map(({ icon: Icon, name, desc, color }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-5 flex gap-4"
              >
                <div className={`mt-0.5 ${color} shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="font-display font-semibold text-sm text-white mb-1">{name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-8 text-center"
        >
          <Shield size={36} className="text-brand-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-white mb-3">Your data never leaves your machine</h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            The AI model (Mistral 7B via Ollama) runs fully offline. News cross-referencing
            queries only contain anonymised claim snippets. No article content, no personal data,
            no analytics are ever uploaded anywhere.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
