"""
guardian_client.py
------------------
Client for The Guardian Open API.
Completely free, no credit card. Get your key instantly at:
https://open-platform.theguardian.com/access/

Returns full article metadata, sections, tags, and body text.
"""

import requests
from config import config


class GuardianClient:

    BASE_URL = "https://content.guardianapis.com"

    def __init__(self):
        self.api_key = config.GUARDIAN_API_KEY
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": config.USER_AGENT,
            "Accept": "application/json",
        })

    def is_configured(self) -> bool:
        return bool(self.api_key) and self.api_key != "your-guardian-api-key-here"

    # ─────────────────────────────────────────
    #  Search articles
    # ─────────────────────────────────────────
    def search(self, query: str, max_results: int = 10) -> dict:
        """
        Search The Guardian's archive for articles matching query.
        Falls back to graceful empty result if no API key set.
        """
        result = {
            "query":    query,
            "articles": [],
            "count":    0,
            "success":  False,
            "error":    "",
            "source":   "guardian",
        }

        if not self.is_configured():
            result["error"] = (
                "Guardian API key not set. "
                "Get a free key at https://open-platform.theguardian.com and add to .env"
            )
            return result

        if not query or len(query.strip()) < 3:
            result["error"] = "Query too short."
            return result

        params = {
            "q":          query[:200],
            "api-key":    self.api_key,
            "page-size":  min(max_results, 20),
            "show-fields":"headline,trailText,byline,firstPublicationDate,wordcount",
            "order-by":   "relevance",
            "format":     "json",
        }

        try:
            response = self.session.get(
                f"{self.BASE_URL}/search",
                params=params,
                timeout=10,
            )
            response.raise_for_status()
            data     = response.json()
            response_data = data.get("response", {})

            if response_data.get("status") != "ok":
                result["error"] = "Guardian API returned non-OK status."
                return result

            raw_results = response_data.get("results", [])
            parsed      = [self._parse_article(a) for a in raw_results if a]
            parsed      = [a for a in parsed if a]

            result["articles"] = parsed
            result["count"]    = len(parsed)
            result["success"]  = True

        except requests.exceptions.Timeout:
            result["error"] = "Guardian API request timed out."
        except requests.exceptions.ConnectionError:
            result["error"] = "Cannot reach Guardian API."
        except Exception as e:
            result["error"] = f"Guardian API error: {str(e)}"

        return result

    # ─────────────────────────────────────────
    #  Search for a specific claim
    # ─────────────────────────────────────────
    def search_claim(self, claim_text: str, keywords: list = None) -> dict:
        query = " ".join(keywords[:4]) if keywords else claim_text[:100]
        return self.search(query, max_results=6)

    # ─────────────────────────────────────────
    #  Parse article from Guardian response
    # ─────────────────────────────────────────
    def _parse_article(self, raw: dict) -> dict | None:
        try:
            fields = raw.get("fields", {})
            title  = fields.get("headline") or raw.get("webTitle", "")
            url    = raw.get("webUrl", "")

            if not url or not title:
                return None

            return {
                "title":    str(title).strip(),
                "url":      str(url).strip(),
                "domain":   "theguardian.com",
                "date":     str(raw.get("webPublicationDate", ""))[:10],
                "section":  str(raw.get("sectionName", "")),
                "author":   str(fields.get("byline", "")),
                "snippet":  str(fields.get("trailText", ""))[:300],
                "source":   "The Guardian",
            }
        except Exception:
            return None
