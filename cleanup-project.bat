@echo off
REM Project Cleanup Script for Sales-Funnel-CM
REM This script removes unnecessary and auto-generated files to free up disk space
REM 
REM SAFE TO REMOVE:
REM - node_modules\ (dependencies - can be reinstalled)
REM - dist\ (Electron build output - can be regenerated)
REM - out\ (Next.js static export - can be regenerated)
REM - tsconfig.tsbuildinfo (TypeScript cache - will be regenerated)
REM - auto-commit.log (log file - will be recreated)

echo.
echo 🧹 Sales-Funnel-CM Project Cleanup Script
echo =========================================
echo.

REM Check what exists and calculate space
set /a totalItems=0
set /a totalSize=0

if exist "node_modules" (
    echo   • node_modules: Dependencies (reinstall with 'npm install')
    set /a totalItems+=1
)

if exist "dist" (
    echo   • dist: Electron build output (regenerate with 'npm run build-electron')
    set /a totalItems+=1
)

if exist "out" (
    echo   • out: Next.js static export (regenerate with 'npm run build')
    set /a totalItems+=1
)

if exist "tsconfig.tsbuildinfo" (
    echo   • tsconfig.tsbuildinfo: TypeScript incremental cache (will be regenerated)
    set /a totalItems+=1
)

if exist "auto-commit.log" (
    echo   • auto-commit.log: Auto-commit log file (will be recreated)
    set /a totalItems+=1
)

echo.
echo 💾 Items to be removed: %totalItems%
echo.

REM Confirmation prompt
set /p confirmation="Do you want to proceed with cleanup? (y/N): "
if /i "%confirmation%"=="y" (
    echo.
    echo 🗑️  Starting cleanup...
    
    REM Remove directories
    if exist "node_modules" (
        echo   Removing directory: node_modules...
        rmdir /s /q "node_modules" 2>nul
        if not exist "node_modules" (
            echo     ✅ node_modules removed successfully
        ) else (
            echo     ❌ Failed to remove node_modules
        )
    )
    
    if exist "dist" (
        echo   Removing directory: dist...
        rmdir /s /q "dist" 2>nul
        if not exist "dist" (
            echo     ✅ dist removed successfully
        ) else (
            echo     ❌ Failed to remove dist
        )
    )
    
    if exist "out" (
        echo   Removing directory: out...
        rmdir /s /q "out" 2>nul
        if not exist "out" (
            echo     ✅ out removed successfully
        ) else (
            echo     ❌ Failed to remove out
        )
    )
    
    REM Remove files
    if exist "tsconfig.tsbuildinfo" (
        echo   Removing file: tsconfig.tsbuildinfo...
        del /q "tsconfig.tsbuildinfo" 2>nul
        if not exist "tsconfig.tsbuildinfo" (
            echo     ✅ tsconfig.tsbuildinfo removed successfully
        ) else (
            echo     ❌ Failed to remove tsconfig.tsbuildinfo
        )
    )
    
    if exist "auto-commit.log" (
        echo   Removing file: auto-commit.log...
        del /q "auto-commit.log" 2>nul
        if not exist "auto-commit.log" (
            echo     ✅ auto-commit.log removed successfully
        ) else (
            echo     ❌ Failed to remove auto-commit.log
        )
    )
    
    echo.
    echo 🎉 Cleanup completed!
    echo.
    echo 📝 Next steps:
    echo   • Run 'npm install' to reinstall dependencies
    echo   • Run 'npm run build' to regenerate Next.js output
    echo   • Run 'npm run build-electron' to regenerate Electron build
    echo.
) else (
    echo ❌ Cleanup cancelled by user
)

echo Press any key to exit...
pause >nul
