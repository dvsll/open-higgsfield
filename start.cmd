@echo off
rem Double-click to start. The first run sets everything up.
cd /d "%~dp0"
title Open Source Higgsfield
where node >nul 2>nul || (
  echo Node.js is needed. Installing it...
  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements || (
    echo Please install Node.js from https://nodejs.org, then double-click start again.
    start "" https://nodejs.org
    pause
    exit /b 1
  )
  set "PATH=%PATH%;%ProgramFiles%\nodejs"
)
set OSH_FROM_START=1
set NEEDS_SETUP=
if not exist "outputs\runtime-config.json" set NEEDS_SETUP=1
if not exist "node_modules\@comfyorg\sdk" set NEEDS_SETUP=1
if defined NEEDS_SETUP (
  node shared\runtime\install.ts || (pause & exit /b 1)
)
echo Starting... your browser will open. Close this window to stop.
call npm start
pause
