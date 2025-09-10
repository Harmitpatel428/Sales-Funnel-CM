# Enterprise Lead Management System - Development Environment Starter
# PowerShell version

Write-Host "Starting Enterprise Lead Management System Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Starting development environment..." -ForegroundColor Green
Write-Host "Development server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auto-commit service will commit changes every 5 minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
Write-Host ""

# Start auto-commit service in background
Write-Host "Starting auto-commit service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run auto-commit" -WindowStyle Normal

# Start development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev
