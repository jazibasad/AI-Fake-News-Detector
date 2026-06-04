import { motion } from 'framer-motion'
import { Calendar, User, FileText, Link2, Tag, AlignLeft } from 'lucide-react'

const TYPE_STYLE = {
  news:          { label: 'News Article',    color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-700/25'   },
  opinion:       { label: 'Opinion Piece',   color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700/25' },
  satire:        { label: 'Satire',          color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/25' },
  report:        { label: 'Report',          color: 'text-brand-400',  bg: 'bg-brand-900/20',  border: 'border-brand-700/25'  },
  press_release: { label: 'Press Release',   color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/25' },
  unknown:       { label: 'Article',         color: 'text-gray-400',   bg: 'bg-gray-800/30',   border: 'border-gray-700/25'   },
}

export default function ArticleMeta({ article = {}, articleType = 'unknown', articleTopic = '' }) {
  const { title, author, publish_date, url, word_count } = article
  const type = TYPE_STYLE[articleType] || TYPE_STYLE.unknown

  const meta = [
    author        && { icon: User,      value: author },
    publish_date  && { icon: Calendar,  value: publish_date.slice(0, 10) },
    word_count    && { icon: AlignLeft, value: `${word_count.toLocaleString()} words` },
    url           && { icon: Link2,     value: new URL(url).hostname.replace('www.',''), href: url },
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      {/* Article type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${type.color} ${type.bg} ${type.border}`}>
          {type.label}
        </span>
        {articleTopic && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Tag size={11} />
            {articleTopic}
          </span>
        )}
      </div>

      {/* Title */}
      {title && (
        <h2 className="font-display font-bold text-lg text-white leading-snug mb-3">
          {title}
        </h2>
      )}

      {/* Meta row */}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {meta.map(({ icon: Icon, value, href }, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon size={12} className="text-gray-600 shrink-0" />
              {href
                ? <a href={href} target="_blank" rel="noopener noreferrer"
                     className="hover:text-brand-400 transition-colors">{value}</a>
                : value
              }
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
