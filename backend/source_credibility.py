"""
source_credibility.py
---------------------
Scores domains and article sources for trustworthiness.
Uses the curated trusted_sources.json database.
No external API — fully offline.
"""

import json
import os
import urllib.parse


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "trusted_sources.json")


class SourceCredibility:

    def __init__(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            self._db = json.load(f)

        self._high       = set(self._db.get("trusted_high", []))
        self._medium     = set(self._db.get("trusted_medium", []))
        self._satire     = set(self._db.get("satire", []))
        self._low        = set(self._db.get("low_credibility", []))
        self._score_map  = self._db.get("score_map", {})

    # ─────────────────────────────────────────
    #  Score a single domain
    # ─────────────────────────────────────────
    def score_domain(self, domain: str) -> dict:
        """
        Returns credibility info for a domain.
        {
            domain, tier, score, label, is_known
        }
        """
        clean = self._clean_domain(domain)

        if clean in self._high:
            return self._make_result(clean, "trusted_high",    self._score_map.get("trusted_high", 95),    "Highly Trusted",       True)
        if clean in self._medium:
            return self._make_result(clean, "trusted_medium",  self._score_map.get("trusted_medium", 72),  "Generally Trusted",    True)
        if clean in self._satire:
            return self._make_result(clean, "satire",          self._score_map.get("satire", 10),          "Satire / Parody",      True)
        if clean in self._low:
            return self._make_result(clean, "low_credibility", self._score_map.get("low_credibility", 5),  "Low Credibility",      True)

        # Unknown domain — neutral score
        return self._make_result(clean, "unknown", self._score_map.get("unknown", 50), "Unknown Source", False)

    # ─────────────────────────────────────────
    #  Score a list of article results
    # ─────────────────────────────────────────
    def score_articles(self, articles: list) -> list:
        """Add credibility scores to a list of article dicts."""
        enriched = []
        for article in articles:
            domain = article.get("domain", "")
            score_info = self.score_domain(domain)
            enriched.append({**article, "credibility": score_info})
        return enriched

    # ─────────────────────────────────────────
    #  Aggregate score across multiple sources
    # ─────────────────────────────────────────
    def aggregate_coverage_score(self, articles: list) -> dict:
        """
        Calculate an aggregate source coverage score from a list of articles.
        Higher score = more trusted sources corroborating the claim.
        """
        if not articles:
            return {"score": 0, "tier": "no_coverage", "label": "No Coverage Found",
                    "count": 0, "trusted_count": 0}

        scored   = self.score_articles(articles)
        scores   = [a["credibility"]["score"] for a in scored]
        trusted  = [a for a in scored if a["credibility"]["tier"] in ("trusted_high", "trusted_medium")]

        avg_score = round(sum(scores) / len(scores), 1) if scores else 0

        # Bonus for multiple trusted sources
        coverage_bonus = min(len(trusted) * 3, 15)
        final_score    = min(avg_score + coverage_bonus, 100)

        tier = "strong"   if final_score >= 75 else \
               "moderate" if final_score >= 50 else \
               "weak"     if final_score >= 25 else "none"

        label = {
            "strong":   "Strong Coverage",
            "moderate": "Moderate Coverage",
            "weak":     "Weak Coverage",
            "none":     "Minimal Coverage",
        }.get(tier, "Unknown")

        return {
            "score":         round(final_score, 1),
            "tier":          tier,
            "label":         label,
            "count":         len(articles),
            "trusted_count": len(trusted),
            "sources":       scored[:5],  # top 5 sources
        }

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────
    def _clean_domain(self, domain: str) -> str:
        domain = str(domain).lower().strip()
        if domain.startswith("www."):
            domain = domain[4:]
        # Remove port if present
        domain = domain.split(":")[0]
        return domain

    def _make_result(self, domain, tier, score, label, is_known):
        return {
            "domain":   domain,
            "tier":     tier,
            "score":    score,
            "label":    label,
            "is_known": is_known,
        }
