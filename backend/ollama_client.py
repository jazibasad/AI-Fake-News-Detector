"""
ollama_client.py
----------------
Thin wrapper around the Ollama local API.
Ollama runs Mistral 7B (or any other model) entirely on your PC.
100% free, works offline, no API key, no usage limits.

Install Ollama: https://ollama.com
Then run:  ollama pull mistral
"""

import json
import requests
from config import config


class OllamaClient:

    def __init__(self):
        self.base_url = config.OLLAMA_BASE_URL
        self.model    = config.OLLAMA_MODEL

    # ─────────────────────────────────────────
    #  Health check
    # ─────────────────────────────────────────
    def is_available(self) -> bool:
        """Check if Ollama is running locally."""
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=3)
            return r.status_code == 200
        except Exception:
            return False

    def get_available_models(self) -> list:
        """List models installed in Ollama."""
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if r.status_code == 200:
                data = r.json()
                return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    # ─────────────────────────────────────────
    #  Core generate call
    # ─────────────────────────────────────────
    def generate(self, prompt: str, system: str = "", temperature: float = 0.1,
                 max_tokens: int = 2048) -> str:
        """
        Send a prompt to the local Ollama model and return the response text.
        Uses non-streaming mode for simplicity.
        """
        payload = {
            "model":  self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
            }
        }
        if system:
            payload["system"] = system

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120,   # local models can take time on first run
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
        except requests.exceptions.Timeout:
            raise RuntimeError("Ollama request timed out. The model may still be loading — please try again.")
        except requests.exceptions.ConnectionError:
            raise RuntimeError(
                "Cannot connect to Ollama. Make sure Ollama is running: "
                "open a terminal and run 'ollama serve', then 'ollama pull mistral'."
            )
        except Exception as e:
            raise RuntimeError(f"Ollama error: {str(e)}")

    # ─────────────────────────────────────────
    #  JSON-mode generate
    # ─────────────────────────────────────────
    def generate_json(self, prompt: str, system: str = "", temperature: float = 0.05) -> dict:
        """
        Generate a response and parse it as JSON.
        Retries once with a stricter prompt if parsing fails.
        """
        raw = self.generate(prompt, system=system, temperature=temperature)

        # Try direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Try extracting JSON block from markdown fences
        import re
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding first { ... } block
        match = re.search(r"(\{.*\})", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        # Return raw as error
        return {"error": "Could not parse JSON", "raw": raw}
