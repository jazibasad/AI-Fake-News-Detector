#!/bin/bash
set -e

echo ""
echo "====================================================="
echo " TruthLens — AI Fake News Detector"
echo " Starting all services..."
echo "====================================================="
echo ""

# ── Check .env exists ──
if [ ! -f "backend/.env" ]; then
    echo " [!] backend/.env not found."
    echo "     Copying .env.template to .env ..."
    cp backend/.env.template backend/.env
    echo "     Please open backend/.env, add your Guardian API key, then re-run."
    exit 1
fi

# ── Check Ollama ──
echo " [1/3] Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "       Ollama not running — starting it..."
    ollama serve &
    sleep 4
else
    echo "       Ollama already running."
fi

# ── Check Mistral model ──
if ! ollama list 2>/dev/null | grep -q "mistral"; then
    echo "       Pulling Mistral model (first time only — ~4GB)..."
    ollama pull mistral
fi

# ── Start Python backend ──
echo " [2/3] Starting Python backend on port 5000..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..
sleep 2

# ── Start React frontend ──
echo " [3/3] Starting React frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "====================================================="
echo " All services running!"
echo " Open:  http://localhost:3000"
echo "====================================================="
echo ""
echo " Backend PID:  $BACKEND_PID"
echo " Frontend PID: $FRONTEND_PID"
echo ""
echo " Press Ctrl+C to stop all services."
echo ""

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
# Open browser (Linux with display)
elif command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
fi

# Keep script running; Ctrl+C kills children
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT
wait
