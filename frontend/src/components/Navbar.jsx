import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Menu, X, Zap } from 'lucide-react'

const navLinks = [
  { label: 'Home',     to: '/' },
  { label: 'Analyze',  to: '/analyze' },
  { label: 'About',    to: '/about' },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-surface-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center group-hover:bg-brand-400 transition-colors duration-200">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              Truth<span className="text-brand-400">Lens</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-brand-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-surface-raised'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-brand-900/40 rounded-lg border border-brand-700/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/analyze')}
              className="btn-primary text-sm py-2 px-5"
            >
              <Zap size={15} />
              Analyze Article
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-surface-border md:hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-brand-900/40 text-brand-400 border border-brand-700/30'
                      : 'text-gray-400 hover:bg-surface-raised hover:text-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => navigate('/analyze')}
                className="btn-primary mt-2 justify-center text-sm"
              >
                <Zap size={15} />
                Analyze Article
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
