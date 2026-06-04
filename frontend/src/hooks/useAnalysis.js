import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = '/api'

const INITIAL_STATE = {
  status:   'idle',   // idle | loading | success | error
  result:   null,
  error:    null,
  stage:    '',
  progress: 0,
}

const STAGES = [
  { key: 'scraping',          label: 'Fetching article...',           pct: 10 },
  { key: 'claim_extraction',  label: 'Extracting claims with AI...',  pct: 30 },
  { key: 'fact_checking',     label: 'Cross-referencing sources...',  pct: 55 },
  { key: 'emotion_analysis',  label: 'Analysing emotion & tone...',   pct: 70 },
  { key: 'bias_detection',    label: 'Detecting bias signals...',     pct: 82 },
  { key: 'fallacy_detection', label: 'Checking logical fallacies...', pct: 90 },
  { key: 'credibility_scoring',label: 'Scoring credibility...',       pct: 98 },
]

export function useAnalysis() {
  const [state, setState] = useState(INITIAL_STATE)

  const setStage = useCallback((stageKey) => {
    const found = STAGES.find(s => s.key === stageKey)
    if (found) {
      setState(prev => ({ ...prev, stage: found.label, progress: found.pct }))
    }
  }, [])

  const analyse = useCallback(async (input) => {
    setState({ status: 'loading', result: null, error: null, stage: STAGES[0].label, progress: 5 })

    // Simulate stage progression while waiting for backend
    let stageIdx = 0
    const stageTimer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, STAGES.length - 1)
      setState(prev => ({
        ...prev,
        stage:    STAGES[stageIdx].label,
        progress: STAGES[stageIdx].pct,
      }))
    }, 1800)

    try {
      let response
      if (input.type === 'url') {
        response = await axios.post(`${API_BASE}/analyse/url`, { url: input.value })
      } else {
        response = await axios.post(`${API_BASE}/analyse/text`, { text: input.value })
      }

      clearInterval(stageTimer)

      if (response.data.status === 'success') {
        setState({
          status:   'success',
          result:   response.data.result,
          error:    null,
          stage:    'Complete',
          progress: 100,
        })
      } else {
        throw new Error(response.data.message || 'Analysis failed.')
      }
    } catch (err) {
      clearInterval(stageTimer)
      const msg = err.response?.data?.message || err.message || 'Unexpected error.'
      setState({ status: 'error', result: null, error: msg, stage: '', progress: 0 })
    }
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return { ...state, analyse, reset }
}
