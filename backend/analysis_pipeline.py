"""
analysis_pipeline.py  (updated — Chunk 4)
------------------------------------------
Full pipeline:
  Stage 1: Scrape article
  Stage 2: Extract claims  (Ollama/Mistral)
  Stage 3: Fact-check      (GDELT + Guardian)
  Stage 4: Credibility score
  Stage 5: Emotion analysis (TextBlob + word lists)  ← NEW Chunk 4
  Stage 6: Bias detection   (spaCy + word lists)     ← NEW Chunk 4
  Stage 7: Fallacy detection (patterns + spaCy)      ← NEW Chunk 4
  Stage 8: Final rescore with bias data              ← NEW Chunk 4
"""

import time
from scraper            import ArticleScraper
from claim_extractor    import ClaimExtractor
from fact_checker       import FactChecker
from credibility_scorer import CredibilityScorer
from emotion_analyzer   import EmotionAnalyzer
from bias_detector      import BiasDetector
from fallacy_detector   import FallacyDetector


class AnalysisPipeline:

    def __init__(self):
        self.scraper   = ArticleScraper()
        self.extractor = ClaimExtractor()
        self.checker   = FactChecker()
        self.scorer    = CredibilityScorer()
        self.emotion   = EmotionAnalyzer()
        self.bias      = BiasDetector()
        self.fallacy   = FallacyDetector()

    def analyse_url(self, url: str) -> dict:
        started = time.time()
        scrape = self.scraper.scrape(url)
        if not scrape["success"]:
            return self._error_response(scrape["error"], "scraping")
        return self._run_pipeline(scrape, started)

    def analyse_text(self, text: str, title: str = "") -> dict:
        started = time.time()
        scrape = {
            "title": title or "Pasted Article",
            "text": text, "author": "",
            "publish_date": "", "url": "",
            "word_count": len(text.split()),
            "success": True, "error": "",
        }
        return self._run_pipeline(scrape, started)

    def _run_pipeline(self, scrape: dict, started: float) -> dict:
        stages = ["scraping"]
        text   = scrape["text"]

        # Stage 2: Claim extraction
        extract = self.extractor.extract(text, article_title=scrape["title"])
        if not extract["success"]:
            return self._error_response(extract.get("error", "Claim extraction failed"), "claim_extraction")
        stages.append("claim_extraction")
        sentences = extract["sentences"]

        # Stage 3: Fact-checking
        fact_check = self.checker.check_claims(extract["claims"], article_topic=extract.get("article_topic",""))
        stages.append("fact_checking")

        # Stage 4: Emotion analysis
        emotion_result = self.emotion.analyse_text(text, sentences=sentences)
        stages.append("emotion_analysis")

        # Stage 5: Bias detection
        bias_result = self.bias.analyse(text, sentences=sentences)
        stages.append("bias_detection")

        # Stage 6: Fallacy detection
        fallacy_result = self.fallacy.detect(sentences)
        stages.append("fallacy_detection")

        # Merge fallacy count into bias result
        bias_result["fallacy_count"] = fallacy_result["fallacy_count"]

        # Merge neutrality into bias result for scorer
        bias_result["neutrality_score"] = min(
            emotion_result["neutrality_score"],
            100 - bias_result["bias_score"]
        )

        # Stage 7: Final credibility score (now includes bias)
        credibility = self.scorer.score(
            fact_check_result=fact_check,
            article_meta={
                "title":        scrape["title"],
                "author":       scrape["author"],
                "publish_date": scrape["publish_date"],
                "url":          scrape["url"],
                "word_count":   scrape["word_count"],
            },
            bias_analysis=bias_result,
        )
        stages.append("credibility_scoring")

        elapsed = round(time.time() - started, 2)

        return {
            "article": {
                "title":        scrape["title"],
                "text":         scrape["text"],
                "author":       scrape["author"],
                "publish_date": scrape["publish_date"],
                "url":          scrape["url"],
                "word_count":   scrape["word_count"],
            },
            "claims":          fact_check["checked_claims"],
            "sentences":       sentences,
            "article_topic":   extract.get("article_topic", ""),
            "article_type":    extract.get("article_type", "unknown"),
            "total_sentences": extract.get("total_sentences", 0),
            "factual_density": extract.get("factual_density", 0.0),

            # Scores
            "credibility_score": credibility,
            "fact_check_summary": {
                "overall_verification_rate": fact_check["overall_verification_rate"],
                "total_sources_found":       fact_check["total_sources_found"],
                "summary":                   fact_check["summary"],
            },

            # Chunk 4 additions
            "bias_analysis":   bias_result,
            "emotion_analysis":emotion_result,
            "heatmap_data":    emotion_result["heatmap_data"],
            "fallacy_analysis":fallacy_result,

            "report_url": None,  # Chunk 6
            "pipeline": {
                "stages_complete": stages,
                "elapsed_seconds": elapsed,
                "success":         True,
                "error":           "",
            }
        }

    def _error_response(self, error: str, stage: str) -> dict:
        return {
            "article": {}, "claims": [], "sentences": [],
            "article_topic": "", "article_type": "unknown",
            "total_sentences": 0, "factual_density": 0.0,
            "credibility_score": None, "fact_check_summary": {},
            "bias_analysis": None, "emotion_analysis": None,
            "heatmap_data": [], "fallacy_analysis": None,
            "report_url": None,
            "pipeline": {
                "stages_complete": [], "elapsed_seconds": 0,
                "success": False, "error": error, "failed_stage": stage,
            }
        }
