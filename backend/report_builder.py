"""
report_builder.py
-----------------
Builds a structured report object from analysis results.
The actual PDF rendering happens client-side using jsPDF + html2canvas
(both free, open-source JS libraries) — no server-side PDF libraries needed.

This module prepares the data payload and a shareable text summary.
"""

import json
from datetime import datetime


class ReportBuilder:

    def build(self, analysis_result: dict) -> dict:
        """
        Convert a full analysis result into a clean report payload.
        Returned to the frontend which renders it as PDF via jsPDF.
        """
        article    = analysis_result.get("article", {})
        credScore  = analysis_result.get("credibility_score", {}) or {}
        claims     = analysis_result.get("claims", [])
        bias       = analysis_result.get("bias_analysis", {}) or {}
        fallacy    = analysis_result.get("fallacy_analysis", {}) or {}
        fact_sum   = analysis_result.get("fact_check_summary", {}) or {}
        pipeline   = analysis_result.get("pipeline", {}) or {}

        # Quick stats
        supported = len([c for c in claims if c.get("fact_check", {}).get("verdict") in ("supported", "likely_true")])
        disputed  = len([c for c in claims if c.get("fact_check", {}).get("verdict") in ("disputed", "false")])
        unverif   = len([c for c in claims if c.get("fact_check", {}).get("verdict") == "unverified"])

        return {
            "generated_at":   datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "app_name":       "TruthLens — AI Fake News Detector",
            "article": {
                "title":        article.get("title", "Unknown Article"),
                "url":          article.get("url", ""),
                "author":       article.get("author", ""),
                "publish_date": article.get("publish_date", ""),
                "word_count":   article.get("word_count", 0),
            },
            "verdict": {
                "score":       credScore.get("score", 0),
                "band":        credScore.get("band", "unknown"),
                "band_label":  credScore.get("band_label", "Unknown"),
                "emoji":       credScore.get("emoji", ""),
                "verdict_text":credScore.get("verdict_text", ""),
            },
            "components":     credScore.get("components", {}),
            "fact_check": {
                "total_claims":          len(claims),
                "supported":             supported,
                "disputed":              disputed,
                "unverified":            unverif,
                "verification_rate":     fact_sum.get("overall_verification_rate", 0),
                "total_sources_found":   fact_sum.get("total_sources_found", 0),
                "summary":               fact_sum.get("summary", ""),
            },
            "bias": {
                "direction":      bias.get("bias_direction", "neutral"),
                "score":          bias.get("bias_score", 0),
                "political_lean": bias.get("political_lean", "Neutral"),
                "loaded_count":   bias.get("loaded_count", 0),
                "summary":        bias.get("summary", ""),
            },
            "fallacies": {
                "count":         fallacy.get("fallacy_count", 0),
                "severity_score":fallacy.get("severity_score", 0),
                "summary":       fallacy.get("summary", ""),
                "types":         fallacy.get("fallacy_types", {}),
            },
            "top_claims": [
                {
                    "text":    c.get("text", ""),
                    "verdict": c.get("fact_check", {}).get("verdict_label", "Unverified"),
                    "confidence": c.get("fact_check", {}).get("confidence", 0),
                }
                for c in claims
                if c.get("importance") == "high"
            ][:5],
            "elapsed_seconds": pipeline.get("elapsed_seconds", 0),
        }

    def build_text_summary(self, report: dict) -> str:
        """Plain text summary for clipboard sharing."""
        v = report["verdict"]
        f = report["fact_check"]
        b = report["bias"]

        lines = [
            f"TruthLens Analysis Report",
            f"Generated: {report['generated_at']}",
            f"",
            f"Article: {report['article']['title']}",
            f"URL: {report['article']['url']}",
            f"",
            f"CREDIBILITY SCORE: {v['score']}/100 — {v['band_label']}",
            f"{v['verdict_text']}",
            f"",
            f"FACT-CHECK: {f['verification_rate']}% of {f['total_claims']} claims verified",
            f"Supported: {f['supported']}  |  Disputed: {f['disputed']}  |  Unverified: {f['unverified']}",
            f"",
            f"BIAS: {b['political_lean']} ({b['score']}/100 bias score)",
            f"",
            f"FALLACIES: {report['fallacies']['count']} detected",
            f"",
            f"Analyzed by TruthLens — 100% free, runs locally",
        ]
        return "\n".join(lines)
