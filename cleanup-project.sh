#!/bin/bash

# Project Cleanup Script for Sales-Funnel-CM
# This script removes unnecessary and auto-generated files to free up disk space
# 
# SAFE TO REMOVE:
# - node_modules/ (dependencies - can be reinstalled)
# - dist/ (Electron build output - can be regenerated)
# - out/ (Next.js static export - can be regenerated)
# - tsconfig.tsbuildinfo (TypeScript cache - will be regenerated)
# - auto-commit.log (log file - will be recreated)

echo ""
echo "🧹 Sales-Funnel-CM Project Cleanup Script"
echo "========================================="
echo ""

# Calculate total space to be freed
total_size=0
items_to_remove=()

# Check node_modules
if [ -d "node_modules" ]; then
    size=$(du -sm node_modules 2>/dev/null | cut -f1)
    total_size=$((total_size + size))
    items_to_remove+=("node_modules:${size}MB:Dependencies (reinstall with 'npm install')")
fi

# Check dist
if [ -d "dist" ]; then
    size=$(du -sm dist 2>/dev/null | cut -f1)
    total_size=$((total_size + size))
    items_to_remove+=("dist:${size}MB:Electron build output (regenerate with 'npm run build-electron')")
fi

# Check out
if [ -d "out" ]; then
    size=$(du -sm out 2>/dev/null | cut -f1)
    total_size=$((total_size + size))
    items_to_remove+=("out:${size}MB:Next.js static export (regenerate with 'npm run build')")
fi

# Check tsconfig.tsbuildinfo
if [ -f "tsconfig.tsbuildinfo" ]; then
    size=$(du -sm tsconfig.tsbuildinfo 2>/dev/null | cut -f1)
    total_size=$((total_size + size))
    items_to_remove+=("tsconfig.tsbuildinfo:${size}MB:TypeScript incremental cache (will be regenerated)")
fi

# Check auto-commit.log
if [ -f "auto-commit.log" ]; then
    size=$(du -sm auto-commit.log 2>/dev/null | cut -f1)
    total_size=$((total_size + size))
    items_to_remove+=("auto-commit.log:${size}MB:Auto-commit log file (will be recreated)")
fi

# Display summary
echo "📊 Cleanup Summary:"
echo "==================="
for item in "${items_to_remove[@]}"; do
    IFS=':' read -r name size desc <<< "$item"
    echo "  • $name: ${size}MB - $desc"
done
echo ""
echo "💾 Total space to be freed: ${total_size}MB"
echo ""

# Confirmation prompt
read -p "Do you want to proceed with cleanup? (y/N): " confirmation
if [[ $confirmation == "y" || $confirmation == "Y" ]]; then
    echo ""
    echo "🗑️  Starting cleanup..."
    
    # Remove directories
    for item in "${items_to_remove[@]}"; do
        IFS=':' read -r name size desc <<< "$item"
        if [[ $name == "node_modules" || $name == "dist" || $name == "out" ]]; then
            echo "  Removing directory: $name..."
            rm -rf "$name" 2>/dev/null
            if [ ! -d "$name" ]; then
                echo "    ✅ $name removed successfully"
            else
                echo "    ❌ Failed to remove $name"
            fi
        fi
    done
    
    # Remove files
    for item in "${items_to_remove[@]}"; do
        IFS=':' read -r name size desc <<< "$item"
        if [[ $name == "tsconfig.tsbuildinfo" || $name == "auto-commit.log" ]]; then
            echo "  Removing file: $name..."
            rm -f "$name" 2>/dev/null
            if [ ! -f "$name" ]; then
                echo "    ✅ $name removed successfully"
            else
                echo "    ❌ Failed to remove $name"
            fi
        fi
    done
    
    echo ""
    echo "🎉 Cleanup completed!"
    echo ""
    echo "📝 Next steps:"
    echo "  • Run 'npm install' to reinstall dependencies"
    echo "  • Run 'npm run build' to regenerate Next.js output"
    echo "  • Run 'npm run build-electron' to regenerate Electron build"
    echo ""
else
    echo "❌ Cleanup cancelled by user"
fi

echo "Press any key to exit..."
read -n 1 -s
