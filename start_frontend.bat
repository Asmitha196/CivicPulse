@echo off
echo ===================================================
echo Starting CivicPulse Frontend Server (Vite React)
echo ===================================================
cd /d "%~dp0frontend"
call npm run dev
pause

