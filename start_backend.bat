@echo off
echo ===================================================
echo Starting CivicPulse Backend Server (FastAPI on Port 8001)
echo ===================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    echo Using Virtual Environment Python...
    ".\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
) else (
    echo Virtual environment not found in %~dp0backend\venv
    pause
    exit /b 1
)
pause

