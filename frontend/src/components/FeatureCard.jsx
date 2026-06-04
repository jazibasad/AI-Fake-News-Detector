import { motion } from 'framer-motion'

export default function FeatureCard({ icon: Icon, title, description, color = 'brand', delay = 0 }) {
  const colorMap = {
    brand:  { bg: 'bg-brand-900/30',  border: 'border-brand-700/30',  icon: 'text-brand-400'  },
    yellow: { bg: 'bg-yellow-900/20', border: 'border-yellow-700/20', icon: 'text-yellow-400' },
    red:    { bg: 'bg-red-900/20',    border: 'border-red-700/20',    icon: 'text-red-400'    },
    blue:   { bg: 'bg-blue-900/20',   border: 'border-blue-700/20',   icon: 'text-blue-400'   },
    purple: { bg: 'bg-purple-900/20', border: 'border-purple-700/20', icon: 'text-purple-400' },
    orange: { bg: 'bg-orange-900/20', border: 'border-orange-700/20', icon: 'text-orange-400' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card p-6 flex flex-col gap-4 hover:border-surface-hover transition-colors duration-200 cursor-default"
    >
      <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
        <Icon size={20} className={c.icon} />
      </div>
      <div>
        <h3 className="font-display font-semibold text-base text-white mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}
