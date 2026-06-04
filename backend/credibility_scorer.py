"""
credibility_scorer.py
---------------------
Calculates the final composite credibility score (0–100) for an article.

Score is built from 5 weighted components:

  Component                    Weight
  ─────────────────────────── ──────
  1. Claim verification rate    35%
  2. Source quality/diversity   25%
  3. Bias severity (Chunk 4)    20%   ← placeholder until Chunk 4
  4. Logical fallacy count      10%   ← placeholder until Chunk 4
  5. Article type / metadata    10%

Score bands:
  80–100  High Credibility   (green)
  60–79   Moderate           (teal)
  40–59   Questionable       (yellow)
  20–39   Low Credibility    (orange)
  0–19    Very Low / Likely Fake (red)
"""


class CredibilityScorer:

    # Component weights (must sum to 1.0)
    WEIGHTS = {
        "verification_rate":  0.35,
        "source_quality":     0.25,
        "bias_severity":      0.20,
        "fallacy_count":      0.10,
        "article_metadata":   0.10,
    }

    # ─────────────────────────────────────────
    #  Main scoring entry point
    # ─────────────────────────────────────────
    def score(self,
              fact_check_result: dict,
              article_meta: dict,
              bias_analysis: dict = None) -> dict:
        """
        Compute the full credibility score.

        Args:
            fact_check_result: output from FactChecker.check_claims()
            article_meta:      article dict (title, url, word_count, etc.)
            bias_analysis:     output from BiasDetector (Chunk 4) or None

        Returns full scoring breakdown dict.
        """

        # ── Component 1: Claim verification rate ──
        verif_rate    = float(fact_check_result.get("overall_verification_rate", 0))
        verif_score   = verif_rate  # already 0–100

        # ── Component 2: Source quality ──
        checked       = fact_check_result.get("checked_claims", [])
        source_score  = self._calc_source_score(checked)

        # ── Component 3: Bias severity (placeholder if Chunk 4 not yet run) ──
        if bias_analysis:
            bias_score = float(bias_analysis.get("neutrality_score", 50))
        else:
            bias_score = 60.0  # neutral default

        # ── Component 4: Fallacy penalty ──
        if bias_analysis:
            fallacy_count = int(bias_analysis.get("fallacy_count", 0))
        else:
            fallacy_count = 0
        fallacy_score = max(0, 100 - (fallacy_count * 12))

        # ── Component 5: Article metadata ──
        meta_score = self._calc_meta_score(article_meta)

        # ── Weighted composite ──
        raw_score = (
            verif_score   * self.WEIGHTS["verification_rate"]  +
            source_score  * self.WEIGHTS["source_quality"]     +
            bias_score    * self.WEIGHTS["bias_severity"]      +
            fallacy_score * self.WEIGHTS["fallacy_count"]      +
            meta_score    * self.WEIGHTS["article_metadata"]
        )

        final = round(min(max(raw_score, 0), 100), 1)

        return {
            "score":       final,
            "band":        self._band(final),
            "band_label":  self._band_label(final),
            "band_color":  self._band_color(final),
            "emoji":       self._band_emoji(final),
            "components": {
                "verification_rate": {
                    "score":  round(verif_score, 1),
                    "weight": self.WEIGHTS["verification_rate"],
                    "label":  "Claim Verification",
                    "detail": f"{verif_rate:.0f}% of claims found in trusted sources",
                },
                "source_quality": {
                    "score":  round(source_score, 1),
                    "weight": self.WEIGHTS["source_quality"],
                    "label":  "Source Quality",
                    "detail": self._source_detail(checked),
                },
                "bias_severity": {
                    "score":  round(bias_score, 1),
                    "weight": self.WEIGHTS["bias_severity"],
                    "label":  "Language Neutrality",
                    "detail": "Bias & emotion analysis" + ("" if bias_analysis else " (pending Chunk 4)"),
                },
                "fallacy_count": {
                    "score":  round(fallacy_score, 1),
                    "weight": self.WEIGHTS["fallacy_count"],
                    "label":  "Logical Soundness",
                    "detail": f"{fallacy_count} logical fallacies detected",
                },
                "article_metadata": {
                    "score":  round(meta_score, 1),
                    "weight": self.WEIGHTS["article_metadata"],
                    "label":  "Article Quality",
                    "detail": self._meta_detail(article_meta),
                },
            },
            "verdict_text": self._verdict_text(final),
        }

    # ─────────────────────────────────────────
    #  Source quality score
    # ─────────────────────────────────────────
    def _calc_source_score(self, checked_claims: list) -> float:
        if not checked_claims:
            return 40.0

        scores = []
        for claim in checked_claims:
            fc = claim.get("fact_check", {})
            coverage = fc.get("coverage", {})
            if coverage.get("tier") == "skipped":
                continue
            scores.append(float(coverage.get("score", 40)))

        return round(sum(scores) / len(scores), 1) if scores else 40.0

    def _source_detail(self, checked_claims: list) -> str:
        total    = len([c for c in checked_claims if c.get("checkable", True)])
        sourced  = len([c for c in checked_claims if c.get("fact_check", {}).get("source_count", 0) > 0])
        return f"{sourced} of {total} claims found in news sources"

    # ─────────────────────────────────────────
    #  Article metadata score
    # ─────────────────────────────────────────
    def _calc_meta_score(self, meta: dict) -> float:
        score = 50.0

        # Has a title
        if meta.get("title"):
            score += 10

        # Has an author
        if meta.get("author"):
            score += 10

        # Has a date
        if meta.get("publish_date"):
            score += 10

        # Reasonable length
        wc = int(meta.get("word_count", 0))
        if wc >= 300:
            score += 10
        elif wc < 100:
            score -= 20

        # Has a URL (not pasted)
        if meta.get("url"):
            score += 5

        return min(max(score, 0), 100)

    def _meta_detail(self, meta: dict) -> str:
        parts = []
        if meta.get("author"):       parts.append("author credited")
        if meta.get("publish_date"): parts.append("date present")
        wc = meta.get("word_count", 0)
        if wc:                       parts.append(f"{wc} words")
        return ", ".join(parts) if parts else "limited metadata"

    # ─────────────────────────────────────────
    #  Band helpers
    # ─────────────────────────────────────────
    def _band(self, score: float) -> str:
        if score >= 80: return "high"
        if score >= 60: return "moderate"
        if score >= 40: return "questionable"
        if score >= 20: return "low"
        return "very_low"

    def _band_label(self, score: float) -> str:
        return {
            "high":         "High Credibility",
            "moderate":     "Moderate Credibility",
            "questionable": "Questionable",
            "low":          "Low Credibility",
            "very_low":     "Very Low / Likely Misleading",
        }[self._band(score)]

    def _band_color(self, score: float) -> str:
        return {
            "high":         "green",
            "moderate":     "teal",
            "questionable": "yellow",
            "low":          "orange",
            "very_low":     "red",
        }[self._band(score)]

    def _band_emoji(self, score: float) -> str:
        return {
            "high":         "✅",
            "moderate":     "🔵",
            "questionable": "⚠️",
            "low":          "🟠",
            "very_low":     "🔴",
        }[self._band(score)]

    def _verdict_text(self, score: float) -> str:
        if score >= 80:
            return "This article appears to be credible. Claims are well-supported by trusted news sources."
        if score >= 60:
            return "This article has moderate credibility. Some claims are supported but further verification is recommended."
        if score >= 40:
            return "This article is questionable. Several claims lack source support or show signs of bias."
        if score >= 20:
            return "This article has low credibility. Claims are largely unsupported and bias signals are strong."
        return "This article appears to be misleading or false. Very few claims are supported and manipulation signals are high."
