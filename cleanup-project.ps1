# Project Cleanup Script for Sales-Funnel-CM
# This script removes unnecessary and auto-generated files to free up disk space
# 
# SAFE TO REMOVE:
# - node_modules/ (dependencies - can be reinstalled)
# - dist/ (Electron build output - can be regenerated)
# - out/ (Next.js static export - can be regenerated)
# - tsconfig.tsbuildinfo (TypeScript cache - will be regenerated)
# - auto-commit.log (log file - will be recreated)

Write-Host "🧹 Sales-Funnel-CM Project Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Calculate total space to be freed
$totalSize = 0
$itemsToRemove = @()

# Check node_modules
if (Test-Path "node_modules") {
    $size = (Get-ChildItem "node_modules" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $totalSize += $size
    $itemsToRemove += @{Name="node_modules"; Size=$size; Description="Dependencies (reinstall with 'npm install')"}
}

# Check dist
if (Test-Path "dist") {
    $size = (Get-ChildItem "dist" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $totalSize += $size
    $itemsToRemove += @{Name="dist"; Size=$size; Description="Electron build output (regenerate with 'npm run build-electron')"}
}

# Check out
if (Test-Path "out") {
    $size = (Get-ChildItem "out" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $totalSize += $size
    $itemsToRemove += @{Name="out"; Size=$size; Description="Next.js static export (regenerate with 'npm run build')"}
}

# Check tsconfig.tsbuildinfo
if (Test-Path "tsconfig.tsbuildinfo") {
    $size = (Get-Item "tsconfig.tsbuildinfo").Length
    $totalSize += $size
    $itemsToRemove += @{Name="tsconfig.tsbuildinfo"; Size=$size; Description="TypeScript incremental cache (will be regenerated)"}
}

# Check auto-commit.log
if (Test-Path "auto-commit.log") {
    $size = (Get-Item "auto-commit.log").Length
    $totalSize += $size
    $itemsToRemove += @{Name="auto-commit.log"; Size=$size; Description="Auto-commit log file (will be recreated)"}
}

# Display summary
Write-Host "📊 Cleanup Summary:" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
foreach ($item in $itemsToRemove) {
    $sizeMB = [math]::Round($item.Size/1MB, 2)
    Write-Host "  • $($item.Name): $sizeMB MB - $($item.Description)" -ForegroundColor White
}
Write-Host ""
$totalSizeMB = [math]::Round($totalSize/1MB, 2)
Write-Host "💾 Total space to be freed: $totalSizeMB MB" -ForegroundColor Green
Write-Host ""

# Confirmation prompt
$confirmation = Read-Host "Do you want to proceed with cleanup? (y/N)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host ""
    Write-Host "🗑️  Starting cleanup..." -ForegroundColor Red
    
    # Remove directories
    foreach ($item in $itemsToRemove) {
        if ($item.Name -in @("node_modules", "dist", "out")) {
            Write-Host "  Removing directory: $($item.Name)..." -ForegroundColor Yellow
            Remove-Item -Path $item.Name -Recurse -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $item.Name)) {
                Write-Host "    ✅ $($item.Name) removed successfully" -ForegroundColor Green
            } else {
                Write-Host "    ❌ Failed to remove $($item.Name)" -ForegroundColor Red
            }
        }
    }
    
    # Remove files
    foreach ($item in $itemsToRemove) {
        if ($item.Name -in @("tsconfig.tsbuildinfo", "auto-commit.log")) {
            Write-Host "  Removing file: $($item.Name)..." -ForegroundColor Yellow
            Remove-Item -Path $item.Name -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $item.Name)) {
                Write-Host "    ✅ $($item.Name) removed successfully" -ForegroundColor Green
            } else {
                Write-Host "    ❌ Failed to remove $($item.Name)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Cleanup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "  • Run 'npm install' to reinstall dependencies" -ForegroundColor White
    Write-Host "  • Run 'npm run build' to regenerate Next.js output" -ForegroundColor White
    Write-Host "  • Run 'npm run build-electron' to regenerate Electron build" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Cleanup cancelled by user" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
