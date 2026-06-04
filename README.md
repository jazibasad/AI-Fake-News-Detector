# TruthLens — AI Fake News Detector

A 100% free, open-source, AI-powered media credibility analyzer.
Every tool used is completely free — no trials, no credit cards, no usage limits.

---

## Project Structure

```
ai-fake-news-detector/
├── frontend/          ← React + Vite + Tailwind (this chunk)
│   ├── src/
│   │   ├── pages/     ← Home, Analyze, About
│   │   ├── components/← Navbar, ArticleInput, FeatureCard, etc.
│   │   └── styles/    ← globals.css (Tailwind + custom)
│   ├── package.json
│   └── vite.config.js
├── backend/           ← Added in Chunk 2 (Python Flask)
├── start.bat          ← Added in Chunk 6 (Windows launcher)
├── start.sh           ← Added in Chunk 6 (Mac/Linux launcher)
└── README.md
```

---

## Chunk 1 — What's included

- React 18 + Vite project scaffold
- Tailwind CSS with full custom design system (dark theme, brand colors)
- Google Fonts: Syne (display) + DM Sans (body) + JetBrains Mono
- Framer Motion animations throughout
- Navbar with active route indicator, mobile hamburger menu
- Home page: hero section, scan animation, feature cards, how-it-works steps, footer
- ArticleInput component: URL tab + paste tab, char counter, validation
- Analyze page: animated step-by-step loading UI (connected to backend in Chunk 2)
- About page: tech stack cards, privacy info
- React Router v6 routing

---

## Setup & Run (Chunk 1 — Frontend Only)

### Prerequisites
- Node.js 18 or higher — download from https://nodejs.org

### Steps

```bash
# 1. Enter the frontend folder
cd ai-fake-news-detector/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Full Tech Stack (100% Free)

| Tool               | Purpose               | Cost          |
|--------------------|-----------------------|---------------|
| React 18 + Vite    | Frontend framework    | FREE          |
| Tailwind CSS       | Styling               | FREE          |
| Framer Motion      | Animations            | FREE          |
| Python Flask       | Backend API (Chunk 2) | FREE          |
| Ollama + Mistral 7B| Local AI model        | FREE, offline |
| GDELT Project API  | News cross-reference  | FREE, no key  |
| Guardian Open API  | News cross-reference  | FREE, no key  |
| spaCy + NLTK       | NLP bias detection    | FREE          |
| jsPDF              | PDF report export     | FREE          |

---

## Chunks Roadmap

| Chunk | Contents                                      | Status      |
|-------|-----------------------------------------------|-------------|
| 1     | Frontend shell (this file)                    | ✅ Complete  |
| 2     | Python backend + Ollama claim extractor       | Coming next |
| 3     | Fact-check engine (GDELT + Guardian)          | Upcoming    |
| 4     | Bias + emotion heatmap NLP engine             | Upcoming    |
| 5     | Full results dashboard UI                     | Upcoming    |
| 6     | PDF report + share + launchers + README       | Final       |
