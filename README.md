# TruthLens — AI Fake News Detector

TruthLens helps you assess **media credibility** by combining:
- AI-assisted **claim extraction**
- **Fact-checking** via open references (GDELT) and Guardian (with a free API key)
- **Bias**, **emotion**, and **fallacy** signals from NLP analysis

> Assistive tool only: this project can surface signals, but it does not guarantee truth.

---

## Features

- URL + pasted text input
- Local AI claim extraction using **Ollama** (default model: `mistral`)
- Cross-reference / fact-checking using:
  - **GDELT Project** (open endpoint, no key)
  - **The Guardian Open Platform** (requires a **free** API key)
- Credibility scoring (0–100)
- Sentence-level **emotion heatmap**
- **Bias detection**
- **Fallacy detection**
- Results dashboard UI
- Report generation (including PDF/text summary in the UI)

---

## Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion
- **Backend:** Python + Flask + Flask-CORS
- **Local AI:** Ollama + Mistral
- **NLP:** spaCy, TextBlob, NLTK

---

## Project structure

```text
ai-fake-news-detector/
├── frontend/     # React + Vite UI
├── backend/      # Flask API + analysis pipeline
├── start.bat     # Windows launcher (Ollama + backend + frontend)
└── start.sh      # macOS/Linux launcher (Ollama + backend + frontend)
```

---

## Deployment / Setup (complete)

### Prerequisites

1) **Node.js 18+**
- Download: https://nodejs.org (LTS recommended)

2) **Python 3.10+**
- Download: https://python.org
- Windows: tick **“Add Python to PATH”** during install

3) **Ollama** (free, offline local AI)
- Download: https://ollama.com
- Install the model:
```bash
ollama pull mistral
```

4) **Guardian API key** (free)
- Register: https://open-platform.theguardian.com
- Copy your API key

---

### Step 1 — Copy backend environment

```bash
cd ai-fake-news-detector/backend
```

Copy the template:
- **Windows:**
```bat
copy .env.template .env
```
- **macOS/Linux:**
```bash
cp .env.template .env
```

Edit `backend/.env` and set:
```env
GUARDIAN_API_KEY=your-guardian-api-key-here
```

---

### Step 2 — Install backend dependencies

```bash
cd ai-fake-news-detector/backend
pip install -r requirements.txt

python -m spacy download en_core_web_sm
python -m textblob.download_corpora
```

---

### Step 3 — Install frontend dependencies

```bash
cd ai-fake-news-detector/frontend
npm install
```

---

### Step 4 — Start Ollama (leave running)

Open a **new terminal** and run:
```bash
ollama serve
```

---

### Step 5 — Launch the app

#### Option A (recommended): one-click launcher

**Windows**
```bat
start.bat
```

**macOS / Linux**
```bash
chmod +x start.sh
./start.sh
```

#### Option B: manual (two terminals)

**Terminal 1 — Backend**
```bash
cd ai-fake-news-detector/backend
python app.py
```

**Terminal 2 — Frontend**
```bash
cd ai-fake-news-detector/frontend
npm run dev
```

---

## Open the app

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/api/health

Expected health response includes Ollama availability, for example:
```json
{
  "status": "success",
  "server": "running",
  "ollama": { "available": true, "has_model": true }
}
```

If `ollama.available` is `false`, ensure `ollama serve` is running.

---

## Backend API

Base URL: `http://localhost:5000`

- `GET /api/health`
- `GET /api/ollama/status`
- `POST /api/analyse/url`
  - Body: `{ "url": "https://..." }`
- `POST /api/analyse/text`
  - Body: `{ "text": "...", "title": "Optional title" }`
- `POST /api/report`
  - Body: `{ "result": <analysis-result> }`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ollama: command not found` | Install Ollama from https://ollama.com |
| `mistral model not found` | Run `ollama pull mistral` |
| Backend won’t start | Ensure `backend/.env` exists and deps are installed |
| Frontend won’t start | Ensure Node 18+ is installed; run `npm install` in `frontend/` |
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` inside `backend/` |
| Guardian API errors | Verify `GUARDIAN_API_KEY` in `backend/.env` |
| Slow analysis | First run can be slower while loading the model into memory |
| CORS errors | Ensure backend is on 5000 and frontend is on 3000 |

---

