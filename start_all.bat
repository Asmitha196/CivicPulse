@echo off
echo ===================================================
echo   CivicPulse - Launching Full Stack Application
echo ===================================================
echo.
echo 1. Starting Backend API on http://127.0.0.1:8001 ...
start "CivicPulse Backend (FastAPI)" cmd /k "call "%~dp0start_backend.bat""

echo 2. Starting Frontend on http://localhost:5173 ...
start "CivicPulse Frontend (Vite)" cmd /k "call "%~dp0start_frontend.bat""

echo.
echo ===================================================
echo   CivicPulse is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8001/docs
echo ===================================================
echo.
timeout /t 5
