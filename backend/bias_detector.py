"""
bias_detector.py
----------------
Detects ideological/political bias and loaded language using:
  - Curated bias signal word lists (emotional_words.json)
  - spaCy NLP for sentence-level scoring
  - TextBlob subjectivity scores

Returns bias direction (left/right/neutral), intensity, and loaded language flags.
All tools are free and open-source.
"""

import os
import json
import re
from textblob import TextBlob


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "emotional_words.json")


class BiasDetector:

    def __init__(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        bias = data.get("bias_signals", {})
        self._left_signals   = [t.lower() for t in bias.get("political_left",  [])]
        self._right_signals  = [t.lower() for t in bias.get("political_right", [])]
        self._loaded_signals = [t.lower() for t in bias.get("loaded_language", [])]
        self._hedge_words    = [t.lower() for t in data.get("hedge_words", [])]
        self._certainty_words= [t.lower() for t in data.get("certainty_words", [])]

        # Try spaCy
        self._nlp = None
        try:
            import spacy
            self._nlp = spacy.load("en_core_web_sm")
        except Exception:
            pass

    # ─────────────────────────────────────────
    #  Full bias analysis
    # ─────────────────────────────────────────
    def analyse(self, text: str, sentences: list = None) -> dict:
        """
        Full bias analysis of article text.

        Returns:
        {
            bias_direction:  'left' | 'right' | 'neutral' | 'mixed',
            bias_score:      float (0-100, how biased),
            neutrality_score:float (0-100, how neutral),
            loaded_language: [...],
            hedge_ratio:     float,
            certainty_ratio: float,
            subjectivity:    float,
            political_lean:  str,
            sentence_bias:   [...],
            summary:         str
        }
        """
        if not text:
            return self._empty_result()

        text_lower = text.lower()
        if not sentences:
            sentences = self._split_sentences(text)

        # Count bias signals
        left_count   = sum(1 for sig in self._left_signals   if sig in text_lower)
        right_count  = sum(1 for sig in self._right_signals  if sig in text_lower)
        loaded_count = sum(1 for sig in self._loaded_signals if sig in text_lower)

        # Collect matched loaded language
        loaded_found = []
        for sig in self._loaded_signals:
            if sig in text_lower:
                loaded_found.append(sig)

        # TextBlob overall subjectivity
        try:
            blob        = TextBlob(text[:3000])
            subjectivity = round(blob.sentiment.subjectivity, 4)
            polarity     = round(blob.sentiment.polarity,     4)
        except Exception:
            subjectivity = 0.5
            polarity     = 0.0

        # Hedge vs certainty ratio
        words         = re.findall(r'\b\w+\b', text_lower)
        total_words   = max(len(words), 1)
        hedge_ratio   = round(sum(1 for w in words if w in self._hedge_words)    / total_words * 100, 2)
        certain_ratio = round(sum(1 for w in words if w in self._certainty_words) / total_words * 100, 2)

        # Determine bias direction
        direction = self._bias_direction(left_count, right_count, loaded_count, subjectivity)

        # Bias intensity score
        bias_signal_strength = (left_count + right_count + loaded_count) / max(total_words / 100, 1)
        bias_score = min(round(
            subjectivity * 40 +
            bias_signal_strength * 30 +
            loaded_count * 5 +
            certain_ratio * 10, 1
        ), 100)

        neutrality = max(0, round(100 - bias_score, 1))

        # Per-sentence bias
        sentence_bias = self._score_sentences(sentences)

        return {
            "bias_direction":    direction,
            "bias_score":        bias_score,
            "neutrality_score":  neutrality,
            "loaded_language":   loaded_found[:10],
            "loaded_count":      loaded_count,
            "left_signals":      left_count,
            "right_signals":     right_count,
            "hedge_ratio":       hedge_ratio,
            "certainty_ratio":   certain_ratio,
            "subjectivity":      subjectivity,
            "polarity":          polarity,
            "political_lean":    self._lean_label(left_count, right_count),
            "sentence_bias":     sentence_bias,
            "fallacy_count":     0,   # filled by orchestrator after FallacyDetector
            "summary":           self._build_summary(direction, bias_score, loaded_found),
        }

    # ─────────────────────────────────────────
    #  Per-sentence bias scores
    # ─────────────────────────────────────────
    def _score_sentences(self, sentences: list) -> list:
        results = []
        for i, sentence in enumerate(sentences[:100]):
            sent_lower = sentence.lower()
            left_hits  = sum(1 for s in self._left_signals   if s in sent_lower)
            right_hits = sum(1 for s in self._right_signals  if s in sent_lower)
            loaded_hits= sum(1 for s in self._loaded_signals if s in sent_lower)

            try:
                blob  = TextBlob(sentence)
                subj  = blob.sentiment.subjectivity
            except Exception:
                subj  = 0.0

            score = min(round(subj * 50 + (left_hits + right_hits) * 10 + loaded_hits * 15, 1), 100)
            lean  = "left" if left_hits > right_hits else "right" if right_hits > left_hits else "neutral"

            results.append({
                "index": i,
                "bias_score": score,
                "lean": lean,
                "loaded_hits": loaded_hits,
            })
        return results

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────
    def _bias_direction(self, left, right, loaded, subjectivity) -> str:
        if left == 0 and right == 0 and loaded < 2 and subjectivity < 0.3:
            return "neutral"
        if left > right * 1.5:   return "left"
        if right > left * 1.5:   return "right"
        if left > 0 or right > 0: return "mixed"
        if loaded > 3:            return "loaded"
        return "neutral"

    def _lean_label(self, left: int, right: int) -> str:
        if left == 0 and right == 0: return "Neutral"
        if left > right * 2:  return "Leans Left"
        if right > left * 2:  return "Leans Right"
        if left > 0 or right > 0: return "Mixed Signals"
        return "Neutral"

    def _build_summary(self, direction: str, score: float, loaded: list) -> str:
        if score < 20:
            return "Language appears largely neutral and factual."
        parts = [f"Bias score: {score:.0f}/100"]
        if direction != "neutral":
            parts.append(f"direction: {direction}")
        if loaded:
            parts.append(f"{len(loaded)} loaded phrase(s) detected")
        return ". ".join(parts) + "."

    def _split_sentences(self, text: str) -> list:
        endings = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')
        return [s.strip() for s in endings.split(text) if len(s.strip().split()) >= 4]

    def _empty_result(self) -> dict:
        return {
            "bias_direction": "neutral", "bias_score": 0,
            "neutrality_score": 100, "loaded_language": [],
            "loaded_count": 0, "left_signals": 0, "right_signals": 0,
            "hedge_ratio": 0, "certainty_ratio": 0,
            "subjectivity": 0, "polarity": 0,
            "political_lean": "Neutral", "sentence_bias": [],
            "fallacy_count": 0, "summary": "No text provided.",
        }
