@echo off
title TruthLens — AI Fake News Detector
color 0A

echo.
echo  =====================================================
echo   TruthLens — AI Fake News Detector
echo   Starting all services...
echo  =====================================================
echo.

REM ── Check .env exists ──
if not exist "backend\.env" (
    echo  [!] backend\.env not found.
    echo      Copying .env.template to .env ...
    copy "backend\.env.template" "backend\.env" >nul
    echo      Please open backend\.env and add your Guardian API key.
    echo      Then run this script again.
    pause
    exit /b 1
)

REM ── Start Ollama if not running ──
echo  [1/3] Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo       Ollama not running — starting it now...
    start "" "ollama" serve
    timeout /t 4 /nobreak >nul
) else (
    echo       Ollama already running.
)

REM ── Start Python backend ──
echo  [2/3] Starting Python backend on port 5000...
cd backend
start "TruthLens Backend" cmd /k "python app.py"
cd ..
timeout /t 2 /nobreak >nul

REM ── Start React frontend ──
echo  [3/3] Starting React frontend on port 3000...
cd frontend
start "TruthLens Frontend" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak >nul

echo.
echo  =====================================================
echo   All services started!
echo   Open your browser: http://localhost:3000
echo  =====================================================
echo.
echo  Press any key to open the browser automatically...
pause >nul
start http://localhost:3000
