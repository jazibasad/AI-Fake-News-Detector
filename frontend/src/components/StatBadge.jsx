import { motion } from 'framer-motion'

export default function StatBadge({ value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center gap-1 px-8 py-5 card"
    >
      <span className="font-display font-bold text-3xl text-gradient">{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
    </motion.div>
  )
}
