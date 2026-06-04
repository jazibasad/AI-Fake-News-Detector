"""
scraper.py
----------
Fetches and cleans article text from a URL.
Uses trafilatura as primary extractor (best-in-class for news articles),
falls back to BeautifulSoup + newspaper3k for edge cases.
All libraries are 100% free and open source.
"""

import re
import requests
import trafilatura
from bs4 import BeautifulSoup
from config import config


class ArticleScraper:

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": config.USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })

    # ─────────────────────────────────────────
    #  Public entry point
    # ─────────────────────────────────────────
    def scrape(self, url: str) -> dict:
        """
        Fetch and extract article from URL.
        Returns a dict with keys:
            title, text, author, publish_date, url, word_count, success, error
        """
        result = {
            "title":        "",
            "text":         "",
            "author":       "",
            "publish_date": "",
            "url":          url,
            "word_count":   0,
            "success":      False,
            "error":        "",
        }

        try:
            response = self.session.get(url, timeout=config.SCRAPER_TIMEOUT)
            response.raise_for_status()
            html = response.text

            # Try trafilatura first — best news extractor
            extracted = self._try_trafilatura(html, url)

            # Fallback to BeautifulSoup if trafilatura returns too little
            if not extracted or len(extracted.get("text", "")) < 200:
                extracted = self._try_beautifulsoup(html, url)

            result.update(extracted)

            # Truncate to max chars
            if len(result["text"]) > config.SCRAPER_MAX_CHARS:
                result["text"] = result["text"][:config.SCRAPER_MAX_CHARS]

            result["word_count"] = len(result["text"].split())
            result["success"]    = len(result["text"]) > 100

            if not result["success"]:
                result["error"] = "Could not extract enough article text from this URL. Try pasting the text directly."

        except requests.exceptions.Timeout:
            result["error"] = "Request timed out. The website took too long to respond."
        except requests.exceptions.ConnectionError:
            result["error"] = "Could not connect to the URL. Check your internet connection."
        except requests.exceptions.HTTPError as e:
            result["error"] = f"HTTP error {e.response.status_code}: The page could not be fetched."
        except Exception as e:
            result["error"] = f"Unexpected error while scraping: {str(e)}"

        return result

    # ─────────────────────────────────────────
    #  Trafilatura extractor (primary)
    # ─────────────────────────────────────────
    def _try_trafilatura(self, html: str, url: str) -> dict:
        try:
            import trafilatura
            result = trafilatura.extract(
                html,
                url=url,
                include_comments=False,
                include_tables=False,
                no_fallback=False,
                favor_precision=True,
            )
            meta = trafilatura.extract_metadata(html, default_url=url)

            return {
                "title":        meta.title        if meta and meta.title        else "",
                "text":         self._clean_text(result) if result else "",
                "author":       meta.author       if meta and meta.author       else "",
                "publish_date": str(meta.date)    if meta and meta.date         else "",
            }
        except Exception:
            return {}

    # ─────────────────────────────────────────
    #  BeautifulSoup fallback extractor
    # ─────────────────────────────────────────
    def _try_beautifulsoup(self, html: str, url: str) -> dict:
        try:
            soup = BeautifulSoup(html, "lxml")

            # Remove noise tags
            for tag in soup(["script", "style", "nav", "header", "footer",
                              "aside", "advertisement", "iframe", "noscript",
                              "form", "button", "figure"]):
                tag.decompose()

            # Title
            title = ""
            title_tag = soup.find("h1") or soup.find("title")
            if title_tag:
                title = title_tag.get_text(strip=True)

            # Author
            author = ""
            author_meta = soup.find("meta", attrs={"name": "author"})
            if author_meta:
                author = author_meta.get("content", "")

            # Date
            date = ""
            for attr in ["article:published_time", "datePublished", "pubdate"]:
                tag = soup.find("meta", attrs={"property": attr}) or \
                      soup.find("meta", attrs={"name": attr}) or \
                      soup.find("time")
                if tag:
                    date = tag.get("content") or tag.get("datetime") or ""
                    if date:
                        break

            # Body text — prefer article/main tags
            body = ""
            for selector in ["article", "main", '[role="main"]',
                              ".article-body", ".post-content",
                              ".entry-content", ".story-body"]:
                container = soup.select_one(selector)
                if container:
                    paragraphs = container.find_all("p")
                    body = " ".join(p.get_text(separator=" ", strip=True) for p in paragraphs)
                    if len(body) > 300:
                        break

            # Last resort — all paragraphs
            if len(body) < 300:
                paragraphs = soup.find_all("p")
                body = " ".join(p.get_text(separator=" ", strip=True) for p in paragraphs)

            return {
                "title":        title,
                "text":         self._clean_text(body),
                "author":       author,
                "publish_date": date,
            }
        except Exception:
            return {}

    # ─────────────────────────────────────────
    #  Text cleaning
    # ─────────────────────────────────────────
    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        # Remove zero-width characters
        text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
        # Remove very short lines (nav remnants)
        lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 40]
        return " ".join(lines) if lines else text
