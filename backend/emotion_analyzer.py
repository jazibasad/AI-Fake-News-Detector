"""
emotion_analyzer.py
-------------------
Scores each sentence for:
  - Sentiment polarity  (-1 to +1)
  - Emotional intensity (0-100)
  - Dominant emotion category
  - Manipulation signal score
  - Heatmap colour tier

Uses TextBlob (free, offline) + curated emotional word lists.
No external API needed.
"""

import os
import json
import re
from textblob import TextBlob


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "emotional_words.json")


class EmotionAnalyzer:

    def __init__(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            self._words = json.load(f)

        # Flatten emotion word lists for fast lookup
        self._emotion_map = {}
        for emotion, words in self._words.get("high_emotion", {}).items():
            for word in words:
                self._emotion_map[word.lower()] = emotion

        self._manipulation = [p.lower() for p in self._words.get("manipulation_patterns", [])]
        self._loaded_lang  = []
        for terms in self._words.get("bias_signals", {}).values():
            self._loaded_lang.extend([t.lower() for t in terms])

    # ─────────────────────────────────────────
    #  Analyse a list of sentences
    # ─────────────────────────────────────────
    def analyse_sentences(self, sentences: list) -> list:
        """
        Returns a list of sentence analysis dicts — one per sentence.
        This is the heatmap data consumed by the frontend.
        """
        results = []
        for i, sentence in enumerate(sentences):
            results.append(self._analyse_single(sentence, i))
        return results

    # ─────────────────────────────────────────
    #  Analyse a full article text
    # ─────────────────────────────────────────
    def analyse_text(self, text: str, sentences: list = None) -> dict:
        """
        Full emotion analysis of article text.
        Returns aggregate stats + per-sentence heatmap data.
        """
        if not sentences:
            sentences = self._split_sentences(text)

        sentence_data = self.analyse_sentences(sentences)

        # Aggregate stats
        intensities    = [s["intensity"] for s in sentence_data]
        polarities     = [s["polarity"]  for s in sentence_data]
        manip_scores   = [s["manipulation_score"] for s in sentence_data]

        avg_intensity  = round(sum(intensities) / len(intensities), 2)  if intensities else 0
        avg_polarity   = round(sum(polarities)  / len(polarities),  4)  if polarities  else 0
        avg_manip      = round(sum(manip_scores) / len(manip_scores), 2) if manip_scores else 0

        # Emotion distribution
        emotion_counts = {}
        for s in sentence_data:
            e = s.get("dominant_emotion", "neutral")
            emotion_counts[e] = emotion_counts.get(e, 0) + 1

        # Manipulation sentences (score > 50)
        high_manip = [s for s in sentence_data if s["manipulation_score"] > 50]

        # Neutrality score: inverse of intensity and manipulation
        neutrality = max(0, round(100 - (avg_intensity * 0.6 + avg_manip * 0.4), 1))

        return {
            "heatmap_data":        sentence_data,
            "avg_intensity":       avg_intensity,
            "avg_polarity":        avg_polarity,
            "avg_manipulation":    avg_manip,
            "neutrality_score":    neutrality,
            "emotion_distribution":emotion_counts,
            "high_manipulation_sentences": len(high_manip),
            "dominant_tone":       self._dominant_tone(avg_polarity, avg_intensity),
            "manipulation_level":  self._manip_level(avg_manip),
        }

    # ─────────────────────────────────────────
    #  Single sentence analysis
    # ─────────────────────────────────────────
    def _analyse_single(self, sentence: str, index: int) -> dict:
        if not sentence or len(sentence.strip()) < 5:
            return self._neutral_result(sentence, index)

        sentence_lower = sentence.lower()
        words          = re.findall(r'\b\w+\b', sentence_lower)

        # TextBlob sentiment
        try:
            blob      = TextBlob(sentence)
            polarity  = round(blob.sentiment.polarity,    4)
            subjective= round(blob.sentiment.subjectivity, 4)
        except Exception:
            polarity   = 0.0
            subjective = 0.0

        # Emotion word count
        emotions_found = {}
        for word in words:
            if word in self._emotion_map:
                emotion = self._emotion_map[word]
                emotions_found[emotion] = emotions_found.get(emotion, 0) + 1

        # Manipulation signals
        manip_score = 0
        for pattern in self._manipulation:
            if pattern in sentence_lower:
                manip_score += 30
        # Loaded language
        for term in self._loaded_lang:
            if term in sentence_lower:
                manip_score += 10
        manip_score = min(manip_score, 100)

        # Intensity: combination of subjectivity, emotion words, manipulation
        word_count      = max(len(words), 1)
        emotion_density = sum(emotions_found.values()) / word_count * 100
        intensity       = round(min(subjective * 60 + emotion_density * 30 + manip_score * 0.1, 100), 1)

        # Dominant emotion
        dominant_emotion = max(emotions_found, key=emotions_found.get) if emotions_found else "neutral"

        # Heatmap tier
        tier  = self._heatmap_tier(intensity, manip_score, polarity)
        color = self._tier_color(tier)

        return {
            "index":             index,
            "text":              sentence,
            "polarity":          polarity,
            "subjectivity":      subjective,
            "intensity":         intensity,
            "manipulation_score":manip_score,
            "dominant_emotion":  dominant_emotion,
            "emotions_found":    emotions_found,
            "tier":              tier,
            "color":             color,
            "tooltip":           self._tooltip(tier, dominant_emotion, manip_score),
        }

    # ─────────────────────────────────────────
    #  Heatmap tier classification
    # ─────────────────────────────────────────
    def _heatmap_tier(self, intensity: float, manip: float, polarity: float) -> str:
        if manip >= 60:                          return "manipulative"
        if intensity >= 70:                      return "highly_emotional"
        if intensity >= 45 or abs(polarity) > 0.5: return "emotional"
        if intensity >= 20 or abs(polarity) > 0.2: return "slightly_emotional"
        return "neutral"

    def _tier_color(self, tier: str) -> str:
        return {
            "manipulative":       "#ef4444",   # red
            "highly_emotional":   "#f97316",   # orange
            "emotional":          "#eab308",   # yellow
            "slightly_emotional": "#3b82f6",   # blue
            "neutral":            "transparent",
        }.get(tier, "transparent")

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────
    def _dominant_tone(self, polarity: float, intensity: float) -> str:
        if intensity < 20:    return "Neutral / Informational"
        if polarity > 0.3:    return "Positive / Promotional"
        if polarity < -0.3:   return "Negative / Alarming"
        if intensity > 60:    return "Highly Emotional"
        return "Mixed / Opinionated"

    def _manip_level(self, score: float) -> str:
        if score >= 60: return "high"
        if score >= 30: return "moderate"
        if score >= 10: return "low"
        return "none"

    def _tooltip(self, tier: str, emotion: str, manip: int) -> str:
        if tier == "manipulative":      return f"⚠ High manipulation signal — {emotion} language"
        if tier == "highly_emotional":  return f"Strong {emotion} language detected"
        if tier == "emotional":         return f"Emotional tone: {emotion}"
        if tier == "slightly_emotional":return "Mildly opinionated language"
        return "Neutral / factual sentence"

    def _split_sentences(self, text: str) -> list:
        import re
        endings = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')
        return [s.strip() for s in endings.split(text) if len(s.strip().split()) >= 4]

    def _neutral_result(self, sentence: str, index: int) -> dict:
        return {
            "index": index, "text": sentence,
            "polarity": 0.0, "subjectivity": 0.0, "intensity": 0.0,
            "manipulation_score": 0, "dominant_emotion": "neutral",
            "emotions_found": {}, "tier": "neutral",
            "color": "transparent", "tooltip": "Neutral sentence",
        }
