"""
app.py  (updated — Chunk 6)
----------------------------
Adds:
  POST /api/report  — build report object from analysis result
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import config
from analysis_pipeline import AnalysisPipeline
from ollama_client import OllamaClient
from report_builder import ReportBuilder

app = Flask(__name__)
app.config["SECRET_KEY"]    = config.SECRET_KEY
app.config["JSON_SORT_KEYS"]= False

CORS(app, resources={
    r"/api/*": {
        "origins":      [config.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
        "methods":      ["GET", "POST", "OPTIONS"],
        "allow_headers":["Content-Type"],
    }
})

pipeline = AnalysisPipeline()
ollama   = OllamaClient()
reporter = ReportBuilder()


def success(data, status=200):
    return jsonify({"status": "success", **data}), status

def error(message, status=400):
    return jsonify({"status": "error", "message": message}), status


@app.route("/api/health", methods=["GET"])
def health():
    ollama_ok     = ollama.is_available()
    ollama_models = ollama.get_available_models() if ollama_ok else []
    return success({
        "server":  "running",
        "version": "1.0.0",
        "ollama":  {"available": ollama_ok, "models": ollama_models, "model_set": config.OLLAMA_MODEL},
        "chunks_complete": ["chunk_1","chunk_2","chunk_3","chunk_4","chunk_5","chunk_6"],
    })


@app.route("/api/ollama/status", methods=["GET"])
def ollama_status():
    available = ollama.is_available()
    models    = ollama.get_available_models() if available else []
    has_model = any(config.OLLAMA_MODEL in m for m in models)
    return success({
        "available":  available,
        "has_model":  has_model,
        "model":      config.OLLAMA_MODEL,
        "models":     models,
        "setup_hint": "" if available else
            "Ollama is not running. Run 'ollama serve' then 'ollama pull mistral'.",
    })


@app.route("/api/analyse/url", methods=["POST"])
def analyse_url():
    data = request.get_json(silent=True) or {}
    url  = str(data.get("url", "")).strip()
    if not url:
        return error("No URL provided.")
    if not (url.startswith("http://") or url.startswith("https://")):
        return error("Invalid URL. Must start with http:// or https://")
    result = pipeline.analyse_url(url)
    if not result["pipeline"]["success"]:
        return error(result["pipeline"]["error"], 422)
    return success({"result": result})


@app.route("/api/analyse/text", methods=["POST"])
def analyse_text():
    data  = request.get_json(silent=True) or {}
    text  = str(data.get("text", "")).strip()
    title = str(data.get("title", "")).strip()
    if not text:
        return error("No article text provided.")
    if len(text) < 100:
        return error("Article text too short. Please provide at least a few paragraphs.")
    if len(text) > 25000:
        text = text[:25000]
    result = pipeline.analyse_text(text, title=title)
    if not result["pipeline"]["success"]:
        return error(result["pipeline"]["error"], 422)
    return success({"result": result})


@app.route("/api/report", methods=["POST"])
def build_report():
    data   = request.get_json(silent=True) or {}
    result = data.get("result")
    if not result:
        return error("No analysis result provided.")
    try:
        report  = reporter.build(result)
        summary = reporter.build_text_summary(report)
        return success({"report": report, "text_summary": summary})
    except Exception as e:
        return error(f"Report generation failed: {str(e)}", 500)


@app.errorhandler(404)
def not_found(_):    return error("Endpoint not found.", 404)

@app.errorhandler(405)
def method_not_allowed(_): return error("Method not allowed.", 405)

@app.errorhandler(500)
def server_error(e): return error(f"Internal server error: {str(e)}", 500)


if __name__ == "__main__":
    print("\n" + "="*52)
    print("  TruthLens Backend — Complete (All 6 Chunks)")
    print("="*52)
    print(f"  Port       : {config.FLASK_PORT}")
    print(f"  Ollama URL : {config.OLLAMA_BASE_URL}")
    print(f"  Model      : {config.OLLAMA_MODEL}")
    print(f"  Frontend   : {config.FRONTEND_URL}")
    print("="*52 + "\n")
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=config.DEBUG)
