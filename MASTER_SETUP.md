# TruthLens — Master Setup Guide
### Run this AFTER extracting all 6 chunks

---

## Step 1 — Merge all chunks into one folder

Extract each ZIP in this exact order, always choosing **Replace/Overwrite** when prompted:

| Order | ZIP file                  | Action                              |
|-------|---------------------------|-------------------------------------|
| 1st   | `chunk-1-foundation.zip`  | Extract — creates `ai-fake-news-detector/` |
| 2nd   | `chunk-2-backend.zip`     | Extract into same folder, overwrite |
| 3rd   | `chunk-3-factcheck.zip`   | Extract into same folder, overwrite |
| 4th   | `chunk-4-bias-emotion.zip`| Extract into same folder, overwrite |
| 5th   | `chunk-5-dashboard.zip`   | Extract into same folder, overwrite |
| 6th   | `chunk-6-final.zip`       | Extract into same folder, overwrite |

Your final folder should look like:
```
ai-fake-news-detector/
├── frontend/
├── backend/
├── start.bat
├── start.sh
├── MASTER_SETUP.md
└── README.md
```

---

## Step 2 — Install prerequisites (one time only)

### A. Node.js 18+
Download from: https://nodejs.org  
Choose the **LTS** version. Install normally.

### B. Python 3.10+
Download from: https://python.org  
**Windows:** tick "Add Python to PATH" during install.

### C. Ollama (local AI runner — free, offline)
Download from: https://ollama.com  
Install it, then open a terminal and run:
```bash
ollama pull mistral
```
This downloads the Mistral 7B model (~4 GB, one-time only).

### D. Guardian API key (free, instant)
1. Go to: https://open-platform.theguardian.com
2. Click **Register** — takes 30 seconds, no credit card
3. Copy your API key

---

## Step 3 — Configure environment

```bash
# Go into the backend folder
cd ai-fake-news-detector/backend

# Copy the template
# Windows:
copy .env.template .env

# Mac/Linux:
cp .env.template .env
```

Open `backend/.env` in any text editor and replace:
```
GUARDIAN_API_KEY=your-guardian-api-key-here
```
with your actual key. Save the file.

---

## Step 4 — Install Python dependencies

```bash
cd ai-fake-news-detector/backend

pip install -r requirements.txt
```

Then download the spaCy language model:
```bash
python -m spacy download en_core_web_sm
```

Then download TextBlob corpora:
```bash
python -m textblob.download_corpora
```

---

## Step 5 — Install frontend dependencies

```bash
cd ai-fake-news-detector/frontend

npm install
```

---

## Step 6 — Start Ollama

Open a **new terminal window** and run:
```bash
ollama serve
```
Leave this terminal open. Ollama runs in the background.

---

## Step 7 — Launch the app

### Option A — One-click launcher (easiest)

**Windows:**
```
Double-click start.bat
```

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

### Option B — Manual (two terminals)

**Terminal 1 — Backend:**
```bash
cd ai-fake-news-detector/backend
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd ai-fake-news-detector/frontend
npm run dev
```

---

## Step 8 — Open the app

Go to: **http://localhost:3000**

You should see the TruthLens landing page.

---

## Verify everything is working

Visit **http://localhost:5000/api/health** in your browser.  
You should see:
```json
{
  "status": "success",
  "server": "running",
  "ollama": { "available": true, "has_model": true }
}
```

If `ollama.available` is `false`, make sure `ollama serve` is running in a terminal.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ollama: command not found` | Download Ollama from https://ollama.com and install it |
| `mistral model not found` | Run `ollama pull mistral` in a terminal |
| Backend won't start | Make sure `backend/.env` exists and Python packages are installed |
| Frontend won't start | Make sure Node 18+ is installed and you ran `npm install` |
| `ModuleNotFoundError` | Re-run `pip install -r requirements.txt` inside the `backend/` folder |
| Guardian API errors | Check your key in `backend/.env` — get a free key at https://open-platform.theguardian.com |
| Slow analysis | Normal — first Ollama run loads the model into RAM. Gets faster after. |
| CORS error in browser | Make sure backend is on port 5000 and frontend on port 3000 |

---

## What each service does

| Service | Port | What it does |
|---------|------|--------------|
| Ollama  | 11434| Runs Mistral 7B AI locally — claim extraction |
| Flask   | 5000 | Python backend — scraping, fact-check, bias, scoring |
| Vite    | 3000 | React frontend — everything you see in the browser |

---

## Full feature list (all chunks combined)

- ✅ URL article scraping (BeautifulSoup + trafilatura)
- ✅ AI claim extraction (Ollama + Mistral 7B, local)
- ✅ Cross-reference via GDELT Project (free, no key)
- ✅ Cross-reference via Guardian Open API (free key)
- ✅ Source credibility scoring (curated trust database)
- ✅ Composite credibility score 0–100 with 5 components
- ✅ Sentence-level emotion heatmap (TextBlob + word lists)
- ✅ Bias detector — political lean, loaded language (spaCy)
- ✅ Logical fallacy detection — 10 fallacy types
- ✅ Results dashboard — 5 tabs (Overview, Claims, Heatmap, Bias, Sources)
- ✅ Animated score meter, radar chart, claim cards
- ✅ PDF report download (jsPDF, client-side)
- ✅ Text summary clipboard copy
- ✅ Dark theme, responsive design, Framer Motion animations
- ✅ 100% free — no paid APIs, no trials, no credit cards
