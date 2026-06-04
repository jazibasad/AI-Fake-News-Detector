import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, Copy, Check, Loader2, FileText } from 'lucide-react'
import axios from 'axios'

export default function ReportGenerator({ result }) {
  const [loading,   setLoading]   = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [error,     setError]     = useState('')
  const reportRef                 = useRef(null)

  if (!result) return null

  // ── Generate + download PDF ──
  const downloadPDF = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Get report data from backend
      const { data } = await axios.post('/api/report', { result })
      const report   = data.report

      // 2. Dynamically import jsPDF (free, client-side)
      const { jsPDF } = await import('jspdf')
      const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const W    = doc.internal.pageSize.getWidth()
      const H    = doc.internal.pageSize.getHeight()
      let   y    = 20

      const addLine = (text, opts = {}) => {
        const { size = 11, bold = false, color = [40,50,45], indent = 20 } = opts
        doc.setFontSize(size)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(String(text), W - indent * 2)
        doc.text(lines, indent, y)
        y += lines.length * (size * 0.45) + 2
        if (y > H - 20) { doc.addPage(); y = 20 }
      }

      const addSpacer = (h = 4) => { y += h }
      const addDivider = () => {
        doc.setDrawColor(38, 48, 48)
        doc.line(20, y, W - 20, y)
        addSpacer(5)
      }

      // Header
      doc.setFillColor(13, 26, 20)
      doc.rect(0, 0, W, 40, 'F')
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(21, 168, 126)
      doc.text('TruthLens', 20, 18)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 140, 130)
      doc.text('AI Fake News Detector — Credibility Report', 20, 27)
      doc.text(`Generated: ${report.generated_at}`, 20, 34)
      y = 50

      // Article
      addLine('ARTICLE', { size: 9, color: [100,120,110] })
      addLine(report.article.title, { size: 14, bold: true })
      if (report.article.url)    addLine(report.article.url,    { size: 9,  color: [80,100,90]  })
      if (report.article.author) addLine(`By ${report.article.author}`, { size: 9, color: [100,120,110] })
      addSpacer()
      addDivider()

      // Score
      const scoreColor = report.verdict.score >= 70 ? [16,185,129] : report.verdict.score >= 45 ? [234,179,8] : [239,68,68]
      addLine('CREDIBILITY SCORE', { size: 9, color: [100,120,110] })
      addLine(`${report.verdict.score}/100 — ${report.verdict.band_label}`, { size: 18, bold: true, color: scoreColor })
      addLine(report.verdict.verdict_text, { size: 10, color: [120,140,130] })
      addSpacer()
      addDivider()

      // Fact check
      addLine('FACT-CHECK RESULTS', { size: 9, color: [100,120,110] })
      addLine(`Verification rate: ${report.fact_check.verification_rate}%`, { size: 12, bold: true })
      addLine(`Claims: ${report.fact_check.total_claims} total  ·  ${report.fact_check.supported} supported  ·  ${report.fact_check.disputed} disputed  ·  ${report.fact_check.unverified} unverified`, { size: 10 })
      addLine(report.fact_check.summary, { size: 9, color: [120,140,130] })
      addSpacer()
      addDivider()

      // Top claims
      if (report.top_claims?.length) {
        addLine('HIGH-IMPORTANCE CLAIMS', { size: 9, color: [100,120,110] })
        report.top_claims.forEach((c, i) => {
          addLine(`${i+1}. ${c.text}`, { size: 9 })
          addLine(`   → ${c.verdict} (${c.confidence}% confidence)`, { size: 9, color: [100,120,110] })
          addSpacer(1)
        })
        addDivider()
      }

      // Bias
      addLine('BIAS ANALYSIS', { size: 9, color: [100,120,110] })
      addLine(`${report.bias.political_lean}  ·  Bias score: ${report.bias.score}/100`, { size: 12, bold: true })
      addLine(report.bias.summary, { size: 9, color: [120,140,130] })
      addSpacer()

      // Fallacies
      addLine('LOGICAL FALLACIES', { size: 9, color: [100,120,110] })
      addLine(`${report.fallacies.count} detected  ·  Severity: ${Math.round(report.fallacies.severity_score)}/100`, { size: 12, bold: true })
      addLine(report.fallacies.summary, { size: 9, color: [120,140,130] })
      addSpacer()
      addDivider()

      // Footer
      addLine('Analyzed by TruthLens — 100% free, open-source, runs locally. No data shared.', { size: 8, color: [80,100,90] })

      doc.save(`truthlens-report-${Date.now()}.pdf`)
    } catch (err) {
      setError('PDF generation failed. Try copying the text summary instead.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Copy text summary ──
  const copyText = async () => {
    try {
      const { data } = await axios.post('/api/report', { result })
      await navigator.clipboard.writeText(data.text_summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      setError('Could not copy to clipboard.')
    }
  }

  return (
    <div className="flex flex-col gap-3" ref={reportRef}>
      <div className="flex gap-2 flex-wrap">
        {/* PDF download */}
        <button
          onClick={downloadPDF}
          disabled={loading}
          className="btn-primary text-xs py-2 px-4 gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" />Generating…</>
            : <><Download size={13} />Download PDF</>
          }
        </button>

        {/* Copy text */}
        <button
          onClick={copyText}
          className="btn-secondary text-xs py-2 px-4 gap-1.5"
        >
          {copied
            ? <><Check size={13} className="text-brand-400" />Copied!</>
            : <><Copy size={13} />Copy Summary</>
          }
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
