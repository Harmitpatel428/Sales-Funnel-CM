@echo off
echo ========================================
echo Enterprise Lead Management System Status
echo ========================================
echo.

echo [GIT STATUS]
git status
echo.

echo [RECENT COMMITS]
git log --oneline -5
echo.

echo [AUTO-COMMIT LOG]
if exist "auto-commit.log" (
    echo Last 5 auto-commit entries:
    powershell "Get-Content auto-commit.log -Tail 5"
) else (
    echo No auto-commit log found
)
echo.

echo [PROJECT INFO]
echo Project: Enterprise Lead Management System v2.0.0
echo Framework: Next.js 15 with TypeScript
echo Platform: Web + Electron Desktop App
echo Auto-commit: Enabled (every 5 minutes)
echo.

echo [QUICK COMMANDS]
echo npm run dev              - Start development server
echo npm run auto-commit:start - Start auto-commit service
echo npm run build            - Build for production
echo npm run build-electron   - Build desktop app
echo.

pause
