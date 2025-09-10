# Auto-Commit Service for Enterprise Lead Management System
# PowerShell version

Write-Host "Starting Auto-Commit Service for Enterprise Lead Management System..." -ForegroundColor Green
Write-Host ""
Write-Host "This will automatically commit changes every 5 minutes." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the service." -ForegroundColor Yellow
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

# Check if git is installed
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Git not found"
    }
    Write-Host "Git version: $gitVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in a git repository
try {
    git status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not in git repository"
    }
    Write-Host "Git repository detected" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Auto-commit service is starting..." -ForegroundColor Green
Write-Host "Log file: auto-commit.log" -ForegroundColor Cyan
Write-Host ""

# Start the auto-commit service
try {
    node auto-commit.js
} catch {
    Write-Host "Error starting auto-commit service: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Auto-commit service has stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
