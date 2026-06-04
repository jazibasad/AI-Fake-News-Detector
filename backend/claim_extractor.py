"""
claim_extractor.py
------------------
Uses the local Ollama/Mistral model to:
  1. Split article into individual sentences
  2. Identify factual claims (vs opinions, background info)
  3. Tag each claim with type, importance, and checkability score
  4. Return structured claim objects ready for fact-checking

All AI inference is local — no internet, no cost.
"""

import re
import json
from ollama_client import OllamaClient


SYSTEM_PROMPT = """You are a professional fact-checking assistant. Your job is to analyze news articles and extract factual claims that can be verified against external sources.

Rules:
- Only extract FACTUAL claims (statistics, events, named persons, dates, locations, accusations)
- Skip pure opinions, editorials, speculation, and rhetorical questions
- Each claim must be self-contained and understandable without context
- Return ONLY valid JSON — no markdown, no explanation, just the JSON object
"""

EXTRACTION_PROMPT_TEMPLATE = """Analyze this article and extract all verifiable factual claims.

ARTICLE:
{text}

Return a JSON object in exactly this format:
{{
  "claims": [
    {{
      "id": 1,
      "text": "The exact or lightly paraphrased claim text",
      "type": "statistic|event|accusation|quote|fact|figure",
      "importance": "high|medium|low",
      "checkable": true,
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "sentence_index": 0
    }}
  ],
  "article_topic": "Brief topic description in 5-10 words",
  "article_type": "news|opinion|satire|report|press_release|unknown",
  "total_sentences": 0,
  "factual_density": 0.0
}}

Extract between 3 and 15 claims. Focus on high-importance checkable claims.
JSON only, no other text:"""


SENTENCE_SPLIT_PROMPT = """Split this article text into individual sentences. Return a JSON array of strings.
Each string is one sentence. Keep sentence order. Remove very short fragments (under 5 words).
Return ONLY the JSON array, nothing else.

TEXT:
{text}

JSON array:"""


class ClaimExtractor:

    def __init__(self):
        self.client = OllamaClient()

    # ─────────────────────────────────────────
    #  Main extraction entry point
    # ─────────────────────────────────────────
    def extract(self, article_text: str, article_title: str = "") -> dict:
        """
        Extract claims from article text using local Mistral AI.

        Returns:
        {
            claims: [...],
            sentences: [...],
            article_topic: str,
            article_type: str,
            total_sentences: int,
            factual_density: float,
            success: bool,
            error: str
        }
        """
        result = {
            "claims":          [],
            "sentences":       [],
            "article_topic":   "",
            "article_type":    "unknown",
            "total_sentences": 0,
            "factual_density": 0.0,
            "success":         False,
            "error":           "",
        }

        if not article_text or len(article_text.strip()) < 100:
            result["error"] = "Article text is too short for analysis."
            return result

        # Check Ollama is running
        if not self.client.is_available():
            result["error"] = (
                "Ollama is not running. Please start it with: ollama serve  "
                "and make sure you have pulled the model: ollama pull mistral"
            )
            return result

        try:
            # Step 1: Split into sentences
            sentences = self._split_sentences(article_text)
            result["sentences"]       = sentences
            result["total_sentences"] = len(sentences)

            # Step 2: Extract claims using AI
            # Truncate text if too long (keep first 3000 chars for speed)
            text_for_ai = article_text[:3000] if len(article_text) > 3000 else article_text
            if article_title:
                text_for_ai = f"TITLE: {article_title}\n\n{text_for_ai}"

            prompt = EXTRACTION_PROMPT_TEMPLATE.format(text=text_for_ai)
            ai_result = self.client.generate_json(prompt, system=SYSTEM_PROMPT, temperature=0.05)

            if "error" in ai_result and "claims" not in ai_result:
                # AI returned bad JSON — use fallback extractor
                claims = self._fallback_extract(sentences)
                result["claims"]  = claims
                result["success"] = len(claims) > 0
                result["error"]   = "AI returned unexpected format; used fallback extractor."
                return result

            # Process AI claims
            raw_claims = ai_result.get("claims", [])
            processed  = self._process_claims(raw_claims, sentences)

            result["claims"]          = processed
            result["article_topic"]   = ai_result.get("article_topic", "")
            result["article_type"]    = ai_result.get("article_type", "unknown")
            result["total_sentences"] = ai_result.get("total_sentences", len(sentences)) or len(sentences)
            result["factual_density"] = float(ai_result.get("factual_density", 0))
            result["success"]         = len(processed) > 0

        except RuntimeError as e:
            result["error"] = str(e)
        except Exception as e:
            result["error"] = f"Claim extraction failed: {str(e)}"

        return result

    # ─────────────────────────────────────────
    #  Sentence splitter
    # ─────────────────────────────────────────
    def _split_sentences(self, text: str) -> list:
        """
        Split text into sentences using regex.
        Falls back to asking Ollama only for very complex text.
        """
        # Simple regex sentence splitter (fast, no dependencies)
        sentence_endings = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')
        raw = sentence_endings.split(text)

        sentences = []
        for s in raw:
            s = s.strip()
            if len(s.split()) >= 5:  # skip fragments
                sentences.append(s)

        return sentences[:200]  # cap at 200 sentences

    # ─────────────────────────────────────────
    #  Process and validate AI claim output
    # ─────────────────────────────────────────
    def _process_claims(self, raw_claims: list, sentences: list) -> list:
        """Validate, deduplicate, and enrich raw claim objects from AI."""
        processed = []
        seen_texts = set()

        valid_types      = {"statistic", "event", "accusation", "quote", "fact", "figure"}
        valid_importance = {"high", "medium", "low"}

        for i, claim in enumerate(raw_claims):
            if not isinstance(claim, dict):
                continue

            text = str(claim.get("text", "")).strip()
            if not text or len(text) < 15:
                continue

            # Deduplicate
            text_key = re.sub(r'\W+', '', text.lower())[:60]
            if text_key in seen_texts:
                continue
            seen_texts.add(text_key)

            # Normalise fields
            claim_type = str(claim.get("type", "fact")).lower()
            if claim_type not in valid_types:
                claim_type = "fact"

            importance = str(claim.get("importance", "medium")).lower()
            if importance not in valid_importance:
                importance = "medium"

            keywords = claim.get("keywords", [])
            if not isinstance(keywords, list):
                keywords = []
            keywords = [str(k).strip() for k in keywords if k][:5]

            # Find sentence index
            sent_idx = int(claim.get("sentence_index", i))
            if sent_idx >= len(sentences):
                sent_idx = min(i, len(sentences) - 1) if sentences else 0

            processed.append({
                "id":             len(processed) + 1,
                "text":           text,
                "type":           claim_type,
                "importance":     importance,
                "checkable":      bool(claim.get("checkable", True)),
                "keywords":       keywords,
                "sentence_index": sent_idx,
                "verified":       None,   # filled by fact_checker in Chunk 3
                "sources":        [],     # filled by fact_checker in Chunk 3
                "bias_score":     None,   # filled by bias_detector in Chunk 4
            })

        # Sort: high importance first
        order = {"high": 0, "medium": 1, "low": 2}
        processed.sort(key=lambda c: order.get(c["importance"], 1))

        return processed[:15]  # max 15 claims

    # ─────────────────────────────────────────
    #  Fallback extractor (no AI needed)
    # ─────────────────────────────────────────
    def _fallback_extract(self, sentences: list) -> list:
        """
        Simple heuristic extractor used when Ollama returns bad JSON.
        Looks for sentences containing numbers, named entities, or action verbs.
        """
        import re
        claims = []
        indicators = [
            r'\b\d+[\.,]?\d*\s*(%|percent|million|billion|thousand)\b',
            r'\b(said|announced|reported|confirmed|denied|claimed|stated|warned|accused)\b',
            r'\b(president|minister|government|official|company|organization|authority)\b',
            r'\b\d{4}\b',  # years
            r'\$[\d,]+',   # dollar amounts
        ]
        pattern = re.compile('|'.join(indicators), re.IGNORECASE)

        for i, sentence in enumerate(sentences):
            if pattern.search(sentence) and len(sentence.split()) >= 8:
                claims.append({
                    "id":             len(claims) + 1,
                    "text":           sentence,
                    "type":           "fact",
                    "importance":     "medium",
                    "checkable":      True,
                    "keywords":       [],
                    "sentence_index": i,
                    "verified":       None,
                    "sources":        [],
                    "bias_score":     None,
                })
            if len(claims) >= 10:
                break

        return claims
