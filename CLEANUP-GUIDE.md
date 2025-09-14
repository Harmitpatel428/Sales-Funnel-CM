# Project Cleanup Guide

This guide helps you safely remove unnecessary and auto-generated files from the Sales-Funnel-CM project to free up disk space.

## 🎯 Files Safe to Remove

### Large Directories (Major Space Savers)
- **`node_modules/`** (~1.09 GB) - Dependencies that can be reinstalled with `npm install`
- **`dist/`** (~780 MB) - Electron build output that can be regenerated with `npm run build-electron`
- **`out/`** (~1.8 MB) - Next.js static export that can be regenerated with `npm run build`

### Generated Files
- **`tsconfig.tsbuildinfo`** (~141 KB) - TypeScript incremental compilation cache
- **`auto-commit.log`** (~24 KB) - Auto-commit service log file

### Total Space Savings: ~1.87 GB

## 🛠️ Cleanup Methods

### Method 1: Interactive Scripts (Recommended)
Choose the appropriate script for your operating system:

**Windows PowerShell:**
```powershell
.\cleanup-project.ps1
```

**Windows Command Prompt:**
```cmd
cleanup-project.bat
```

**Linux/macOS:**
```bash
./cleanup-project.sh
```

### Method 2: NPM Scripts
Use the enhanced npm scripts:

```bash
# Remove all unnecessary files (nuclear option)
npm run clean:all

# Remove only build outputs
npm run clean:build

# Remove only dependencies
npm run clean:deps

# Original clean script (build outputs only)
npm run clean
```

### Method 3: Manual Removal
If you prefer manual control, you can remove these items individually:

```bash
# Remove directories
rm -rf node_modules
rm -rf dist
rm -rf out

# Remove files
rm -f tsconfig.tsbuildinfo
rm -f auto-commit.log
```

## 🔄 After Cleanup

After running cleanup, you'll need to regenerate the removed items:

```bash
# Reinstall dependencies
npm install

# Regenerate Next.js build output
npm run build

# Regenerate Electron build (if needed)
npm run build-electron
```

## ⚠️ Important Notes

1. **Source Code Safety**: This cleanup only removes generated/temporary files. All source code (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.html`, `.md`) is preserved.

2. **Configuration Files**: All configuration files (`package.json`, `tsconfig.json`, `next.config.ts`, etc.) are preserved.

3. **Public Assets**: The `public/` directory and all assets are preserved.

4. **Auto-commit**: The auto-commit service will recreate its log file automatically.

5. **TypeScript**: The TypeScript compiler will regenerate the incremental cache on next compilation.

## 🎯 When to Clean Up

Consider running cleanup when:
- Running low on disk space
- Before sharing the project (to reduce size)
- After major dependency updates
- Before archiving the project
- When switching between different development environments

## 🔍 What's Preserved

The cleanup scripts are designed to be safe and only remove:
- ✅ Build outputs and caches
- ✅ Dependencies (reinstallable)
- ✅ Log files
- ✅ Temporary files

Everything else is preserved:
- ✅ Source code files
- ✅ Configuration files
- ✅ Documentation
- ✅ Public assets
- ✅ Git history
- ✅ Custom scripts

## 🚀 Quick Start

1. Run the appropriate cleanup script for your OS
2. Confirm the cleanup when prompted
3. Run `npm install` to reinstall dependencies
4. Continue development as normal

The project will function exactly the same after cleanup and regeneration!
