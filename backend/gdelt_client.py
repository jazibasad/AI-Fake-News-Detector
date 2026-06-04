"""
gdelt_client.py
---------------
Client for the GDELT Project API — 100% free, no API key, no signup.
https://blog.gdeltproject.org/gdelt-2-0-our-global-archive-is-now-live/

GDELT monitors world news in 65 languages across 65 countries in near-realtime.
The Doc 2.0 API lets us query by keyword and get matching article metadata.
"""

import requests
import urllib.parse
from datetime import datetime, timedelta
from config import config


class GDELTClient:

    BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": config.USER_AGENT,
            "Accept": "application/json",
        })

    # ─────────────────────────────────────────
    #  Search for articles matching a query
    # ─────────────────────────────────────────
    def search(self, query: str, max_results: int = 10, days_back: int = 30) -> dict:
        """
        Search GDELT for articles matching the query string.
        Returns structured result with articles and match count.
        """
        result = {
            "query":    query,
            "articles": [],
            "count":    0,
            "success":  False,
            "error":    "",
        }

        if not query or len(query.strip()) < 3:
            result["error"] = "Query too short."
            return result

        # Build date range
        end_dt   = datetime.utcnow()
        start_dt = end_dt - timedelta(days=days_back)
        timespan = f"{days_back * 24}h"

        params = {
            "query":     self._clean_query(query),
            "mode":      "artlist",
            "maxrecords": min(max_results, 25),
            "format":    "json",
            "timespan":  timespan,
            "sort":      "hybridrel",
        }

        try:
            response = self.session.get(
                self.BASE_URL,
                params=params,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            articles = data.get("articles", [])
            parsed   = [self._parse_article(a) for a in articles if a]
            parsed   = [a for a in parsed if a]  # remove None

            result["articles"] = parsed
            result["count"]    = len(parsed)
            result["success"]  = True

        except requests.exceptions.Timeout:
            result["error"] = "GDELT request timed out."
        except requests.exceptions.ConnectionError:
            result["error"] = "Cannot reach GDELT API. Check internet connection."
        except Exception as e:
            result["error"] = f"GDELT error: {str(e)}"

        return result

    # ─────────────────────────────────────────
    #  Search for a specific claim
    # ─────────────────────────────────────────
    def search_claim(self, claim_text: str, keywords: list = None) -> dict:
        """
        Search for articles that may corroborate or contradict a claim.
        Uses claim keywords for efficient querying.
        """
        # Build effective search query from keywords or claim text
        if keywords and len(keywords) >= 2:
            query = " ".join(keywords[:4])
        else:
            # Extract key noun phrases from claim text (simple approach)
            query = self._extract_search_terms(claim_text)

        return self.search(query, max_results=8, days_back=60)

    # ─────────────────────────────────────────
    #  Parse single article from GDELT response
    # ─────────────────────────────────────────
    def _parse_article(self, raw: dict) -> dict | None:
        try:
            url    = str(raw.get("url", "")).strip()
            title  = str(raw.get("title", "")).strip()
            domain = self._extract_domain(url)
            seendate = str(raw.get("seendate", ""))

            if not url or not title:
                return None

            return {
                "title":    title,
                "url":      url,
                "domain":   domain,
                "date":     self._format_date(seendate),
                "language": str(raw.get("language", "English")),
                "source":   str(raw.get("domain", domain)),
            }
        except Exception:
            return None

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────
    def _clean_query(self, q: str) -> str:
        """Remove special chars, keep alphanumeric and spaces."""
        import re
        q = re.sub(r'[^\w\s]', ' ', q)
        q = re.sub(r'\s+', ' ', q).strip()
        return q[:200]

    def _extract_search_terms(self, text: str) -> str:
        """Extract the most meaningful words from a claim for GDELT search."""
        import re
        # Remove common stop words
        stop = {"the","a","an","is","are","was","were","be","been","being",
                "have","has","had","do","does","did","will","would","could",
                "should","may","might","shall","can","need","dare","used",
                "of","in","on","at","to","for","from","with","by","about",
                "as","it","its","this","that","these","those","and","or",
                "but","not","no","so","yet","both","either","neither","nor",
                "just","also","only","even","still","whether","though"}

        words = re.findall(r'\b[a-zA-Z]{3,}\b', text)
        filtered = [w for w in words if w.lower() not in stop]

        # Capitalised words (names, places) get priority
        caps   = [w for w in filtered if w[0].isupper()]
        others = [w for w in filtered if not w[0].isupper()]

        combined = caps[:3] + others[:3]
        return " ".join(combined[:5]) if combined else " ".join(filtered[:5])

    def _extract_domain(self, url: str) -> str:
        try:
            parsed = urllib.parse.urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return ""

    def _format_date(self, raw: str) -> str:
        """Convert GDELT date format YYYYMMDDTHHMMSSZ to readable string."""
        try:
            if len(raw) >= 8:
                return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
        except Exception:
            pass
        return raw
