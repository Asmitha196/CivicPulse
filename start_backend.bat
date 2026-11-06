@echo off
echo ===================================================
echo Starting CivicPulse Backend Server (FastAPI)
echo ===================================================
cd backend
if not exist venv (
    echo Virtual environment not found. Please run: python -m venv venv
    pause
    exit /b 1
)
call .\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

