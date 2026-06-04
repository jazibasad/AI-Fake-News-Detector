"""
fallacy_detector.py
-------------------
Detects logical fallacies in article text using:
  1. Pattern matching against fallacy_patterns.json
  2. spaCy dependency parsing for complex patterns

All tools are 100% free and open source.
"""

import os
import json
import re


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "fallacy_patterns.json")


class FallacyDetector:

    def __init__(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        self._fallacies = data.get("fallacies", [])

        # Try to load spaCy (graceful fallback if not installed)
        self._nlp = None
        try:
            import spacy
            self._nlp = spacy.load("en_core_web_sm")
        except Exception:
            pass   # Will use pattern-only detection

    # ─────────────────────────────────────────
    #  Detect fallacies in a list of sentences
    # ─────────────────────────────────────────
    def detect(self, sentences: list) -> dict:
        """
        Scans each sentence for logical fallacy patterns.

        Returns:
        {
            fallacies_found: [...],   # list of detected instances
            fallacy_types:   {...},   # count per type
            fallacy_count:   int,
            severity_score:  float,  # 0-100, higher = more fallacies
            affected_sentences: [int]
        }
        """
        found     = []
        affected  = set()
        type_counts = {}

        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()

            for fallacy in self._fallacies:
                matched_patterns = []
                for pattern in fallacy["patterns"]:
                    if pattern.lower() in sentence_lower:
                        matched_patterns.append(pattern)

                if matched_patterns:
                    fid   = fallacy["id"]
                    found.append({
                        "sentence_index":  i,
                        "sentence_text":   sentence[:200],
                        "fallacy_id":      fid,
                        "fallacy_name":    fallacy["name"],
                        "description":     fallacy["description"],
                        "severity":        fallacy["severity"],
                        "matched_pattern": matched_patterns[0],
                        "color":           self._severity_color(fallacy["severity"]),
                    })
                    affected.add(i)
                    type_counts[fid] = type_counts.get(fid, 0) + 1

        # spaCy-enhanced detection (if available)
        if self._nlp:
            spacy_finds = self._spacy_detect(sentences)
            for sf in spacy_finds:
                # Avoid duplicates
                existing_ids = {f["sentence_index"] for f in found if f["fallacy_id"] == sf["fallacy_id"]}
                if sf["sentence_index"] not in existing_ids:
                    found.append(sf)
                    affected.add(sf["sentence_index"])
                    fid = sf["fallacy_id"]
                    type_counts[fid] = type_counts.get(fid, 0) + 1

        fallacy_count = len(found)
        severity_score = self._calc_severity_score(found)

        return {
            "fallacies_found":    found,
            "fallacy_types":      type_counts,
            "fallacy_count":      fallacy_count,
            "severity_score":     severity_score,
            "affected_sentences": sorted(list(affected)),
            "summary":            self._build_summary(type_counts, fallacy_count),
        }

    # ─────────────────────────────────────────
    #  spaCy enhanced patterns
    # ─────────────────────────────────────────
    def _spacy_detect(self, sentences: list) -> list:
        """Use spaCy NLP for more nuanced fallacy detection."""
        found = []
        try:
            for i, sentence in enumerate(sentences[:50]):  # limit for speed
                doc = self._nlp(sentence)

                # Detect hasty generalisation via entity + "all/every/never"
                has_entity   = any(ent.label_ in ("PERSON","ORG","GPE","NORP") for ent in doc.ents)
                has_absolute = any(tok.lower_ in ("all","every","never","always","none","nobody","everybody") for tok in doc)
                if has_entity and has_absolute:
                    found.append({
                        "sentence_index": i,
                        "sentence_text":  sentence[:200],
                        "fallacy_id":     "hasty_generalisation",
                        "fallacy_name":   "Hasty Generalisation",
                        "description":    "Broad absolute claim applied to a specific group",
                        "severity":       "medium",
                        "matched_pattern":"spaCy: entity + absolute quantifier",
                        "color":          self._severity_color("medium"),
                    })

                # Detect appeal to fear via threat + future tense
                has_future = any(tok.tag_ in ("MD",) and tok.lower_ in ("will","shall","going") for tok in doc)
                has_threat = any(tok.lower_ in ("destroy","end","collapse","fail","die","suffer","attack") for tok in doc)
                if has_future and has_threat:
                    found.append({
                        "sentence_index": i,
                        "sentence_text":  sentence[:200],
                        "fallacy_id":     "appeal_to_fear",
                        "fallacy_name":   "Appeal to Fear",
                        "description":    "Threatening future outcome used to manipulate",
                        "severity":       "high",
                        "matched_pattern":"spaCy: future modal + threat verb",
                        "color":          self._severity_color("high"),
                    })
        except Exception:
            pass

        return found

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────
    def _calc_severity_score(self, found: list) -> float:
        if not found:
            return 0.0
        severity_weights = {"high": 20, "medium": 10, "low": 5}
        total = sum(severity_weights.get(f["severity"], 5) for f in found)
        return min(round(total, 1), 100)

    def _severity_color(self, severity: str) -> str:
        return {"high": "red", "medium": "orange", "low": "yellow"}.get(severity, "gray")

    def _build_summary(self, type_counts: dict, total: int) -> str:
        if total == 0:
            return "No logical fallacies detected."
        types = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
        top   = [t[0].replace("_", " ").title() for t, _ in [(t, c) for t, c in types[:3]]]
        return f"{total} fallacy instance(s) detected: {', '.join(top)}."
