"""
fact_checker.py
---------------
Cross-references extracted claims against:
  1. GDELT Project API  (free, no key, global coverage)
  2. Guardian Open API  (free key, high-quality journalism)

For each claim it determines:
  - corroboration level (supported / disputed / unverified)
  - source coverage score
  - list of matching articles
  - overall claim confidence
"""

import time
from gdelt_client       import GDELTClient
from guardian_client    import GuardianClient
from source_credibility import SourceCredibility


class FactChecker:

    def __init__(self):
        self.gdelt      = GDELTClient()
        self.guardian   = GuardianClient()
        self.credibility = SourceCredibility()

    # ─────────────────────────────────────────
    #  Check a list of claims
    # ─────────────────────────────────────────
    def check_claims(self, claims: list, article_topic: str = "") -> dict:
        """
        Fact-check a list of claim objects (from ClaimExtractor).

        Returns:
        {
            checked_claims: [...],   # claims enriched with fact-check data
            overall_verification_rate: float,
            total_sources_found: int,
            summary: str
        }
        """
        if not claims:
            return {
                "checked_claims":           [],
                "overall_verification_rate": 0.0,
                "total_sources_found":      0,
                "summary":                  "No claims to check.",
            }

        checked      = []
        total_sources = 0

        for claim in claims:
            # Only fact-check high and medium importance, checkable claims
            if not claim.get("checkable", True) or claim.get("importance") == "low":
                checked.append({**claim, "fact_check": self._empty_fact_check()})
                continue

            result = self._check_single_claim(claim)
            checked.append({**claim, "fact_check": result})
            total_sources += result.get("source_count", 0)

            # Slight delay to avoid hammering free APIs
            time.sleep(0.3)

        # Calculate overall verification rate
        checkable = [c for c in checked if c.get("checkable", True) and c.get("importance") != "low"]
        supported = [c for c in checkable if c["fact_check"]["verdict"] in ("supported", "likely_true")]
        rate = round(len(supported) / len(checkable) * 100, 1) if checkable else 0.0

        return {
            "checked_claims":            checked,
            "overall_verification_rate": rate,
            "total_sources_found":       total_sources,
            "summary":                   self._build_summary(checked, rate),
        }

    # ─────────────────────────────────────────
    #  Check a single claim
    # ─────────────────────────────────────────
    def _check_single_claim(self, claim: dict) -> dict:
        claim_text = claim.get("text", "")
        keywords   = claim.get("keywords", [])

        all_articles = []

        # Query GDELT
        gdelt_result = self.gdelt.search_claim(claim_text, keywords)
        if gdelt_result["success"]:
            all_articles.extend(gdelt_result["articles"])

        # Query Guardian (if key is configured)
        if self.guardian.is_configured():
            guardian_result = self.guardian.search_claim(claim_text, keywords)
            if guardian_result["success"]:
                all_articles.extend(guardian_result["articles"])

        # Deduplicate by URL
        seen_urls   = set()
        unique_arts = []
        for art in all_articles:
            url = art.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_arts.append(art)

        # Score sources
        coverage = self.credibility.aggregate_coverage_score(unique_arts)

        # Determine verdict
        verdict, confidence = self._determine_verdict(coverage, unique_arts)

        return {
            "verdict":       verdict,
            "confidence":    confidence,
            "coverage":      coverage,
            "source_count":  len(unique_arts),
            "top_sources":   coverage.get("sources", [])[:4],
            "verdict_label": self._verdict_label(verdict),
            "verdict_color": self._verdict_color(verdict),
        }

    # ─────────────────────────────────────────
    #  Verdict logic
    # ─────────────────────────────────────────
    def _determine_verdict(self, coverage: dict, articles: list) -> tuple:
        """
        Determine verdict and confidence score (0–100).
        Logic: based on coverage tier, number of trusted sources, and source scores.
        """
        score          = coverage.get("score", 0)
        trusted_count  = coverage.get("trusted_count", 0)
        total_count    = coverage.get("count", 0)

        if total_count == 0:
            return "unverified", 30

        if trusted_count >= 3 and score >= 75:
            return "supported", min(score, 95)

        if trusted_count >= 1 and score >= 60:
            return "likely_true", min(score, 82)

        if total_count >= 2 and score >= 40:
            return "partially_verified", min(score, 65)

        if total_count >= 1 and score < 30:
            return "disputed", max(100 - score, 50)

        return "unverified", 40

    def _verdict_label(self, verdict: str) -> str:
        return {
            "supported":           "Supported",
            "likely_true":         "Likely True",
            "partially_verified":  "Partially Verified",
            "unverified":          "Unverified",
            "disputed":            "Disputed",
            "false":               "False",
        }.get(verdict, "Unknown")

    def _verdict_color(self, verdict: str) -> str:
        return {
            "supported":           "green",
            "likely_true":         "teal",
            "partially_verified":  "yellow",
            "unverified":          "gray",
            "disputed":            "orange",
            "false":               "red",
        }.get(verdict, "gray")

    # ─────────────────────────────────────────
    #  Summary builder
    # ─────────────────────────────────────────
    def _build_summary(self, checked_claims: list, rate: float) -> str:
        total     = len(checked_claims)
        supported = sum(1 for c in checked_claims if c["fact_check"]["verdict"] in ("supported", "likely_true"))
        disputed  = sum(1 for c in checked_claims if c["fact_check"]["verdict"] in ("disputed", "false"))
        unverif   = sum(1 for c in checked_claims if c["fact_check"]["verdict"] == "unverified")

        parts = [f"{total} claims analysed"]
        if supported:  parts.append(f"{supported} supported by sources")
        if disputed:   parts.append(f"{disputed} disputed")
        if unverif:    parts.append(f"{unverif} could not be verified")

        return ". ".join(parts) + f". Overall verification rate: {rate}%."

    def _empty_fact_check(self) -> dict:
        return {
            "verdict":       "skipped",
            "confidence":    0,
            "coverage":      {"score": 0, "tier": "skipped", "label": "Skipped", "count": 0, "trusted_count": 0},
            "source_count":  0,
            "top_sources":   [],
            "verdict_label": "Skipped",
            "verdict_color": "gray",
        }
