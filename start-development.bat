@echo off
echo Starting Enterprise Lead Management System Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting development server...
echo Starting auto-commit service...
echo.
echo Development server will be available at: http://localhost:3000
echo Auto-commit service will commit changes every 5 minutes
echo.
echo Press Ctrl+C to stop both services
echo.

REM Start both services concurrently
start "Auto-Commit Service" cmd /k "npm run auto-commit"
start "Development Server" cmd /k "npm run dev"

echo Both services started in separate windows.
echo You can close this window now.
pause
