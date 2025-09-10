@echo off
echo Starting Auto-Commit Service for Enterprise Lead Management System...
echo.
echo This will automatically commit changes every 5 minutes.
echo Press Ctrl+C to stop the service.
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Not in a git repository
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo Auto-commit service is starting...
echo Log file: auto-commit.log
echo.

REM Start the auto-commit service
node auto-commit.js

echo.
echo Auto-commit service has stopped.
pause
