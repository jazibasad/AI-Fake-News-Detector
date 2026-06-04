import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    FLASK_ENV     = os.getenv("FLASK_ENV", "development")
    FLASK_PORT    = int(os.getenv("FLASK_PORT", 5000))
    SECRET_KEY    = os.getenv("SECRET_KEY", "dev-secret-key")
    DEBUG         = FLASK_ENV == "development"

    # Ollama (local AI — no cost, no key)
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "mistral")

    # Guardian Open API (free key from open-platform.theguardian.com)
    GUARDIAN_API_KEY = os.getenv("GUARDIAN_API_KEY", "")
    GUARDIAN_BASE_URL = "https://content.guardianapis.com"

    # GDELT Project (no key — completely open)
    GDELT_BASE_URL = os.getenv("GDELT_BASE_URL", "https://api.gdeltproject.org/api/v2/doc/doc")

    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Scraper settings
    SCRAPER_TIMEOUT    = 15   # seconds
    SCRAPER_MAX_CHARS  = 20000
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

config = Config()
