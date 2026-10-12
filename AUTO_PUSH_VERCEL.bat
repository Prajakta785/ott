@echo off
title Gramin Bharat TV - Auto Push to Vercel
cd /d "%~dp0"
echo ========================================================
echo     GRAMIN BHARAT TV - AUTO PUSH TO VERCEL
echo ========================================================
echo.
echo Choose an option:
echo [1] Push changes now (1-Click Push to Vercel)
echo [2] Continuous Watch Mode (Auto push every time you save a file)
echo.
set /p opt="Enter option (1 or 2, default is 1): "

if "%opt%"=="2" (
  echo.
  echo Starting Continuous Watcher...
  node scripts/auto-push.js watch
) else (
  echo.
  echo Pushing changes to Vercel now...
  node scripts/auto-push.js
  echo.
  pause
)
