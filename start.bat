@echo off
cd /d "%~dp0"
title FlowState - Expo
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening nodejs.org - install the LTS version, then run this file again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
echo Checking dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 ( pause & exit /b 1 )
echo.
echo Scan the QR code with your iPhone camera (Expo Go must be installed).
echo Phone and PC must be on the same Wi-Fi. Otherwise use start-tunnel.bat
echo.
call npx expo start
pause
