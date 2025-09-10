# Auto-Commit Service

This project includes an automated git commit service that will automatically commit changes to your repository at regular intervals.

## Features

- **Automatic Commits**: Commits changes every 5 minutes (configurable)
- **Smart Filtering**: Excludes build files, dependencies, and other generated content
- **Detailed Logging**: Comprehensive logs of all auto-commit activities
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Configurable**: Easy to customize commit intervals and exclusion patterns

## Quick Start

### Windows (Batch File)
```bash
npm run auto-commit:start
```
or double-click `start-auto-commit.bat`

### Windows (PowerShell)
```powershell
.\start-auto-commit.ps1
```

### Cross-Platform (Node.js)
```bash
npm run auto-commit
```

## Configuration

Edit `auto-commit.config.json` to customize:

- `commitInterval`: Time between commits in milliseconds (default: 300000 = 5 minutes)
- `excludePatterns`: Files/folders to ignore (supports glob patterns)
- `logFile`: Location of the log file
- `maxLogSize`: Maximum log file size before rotation
- `commitMessageTemplate`: Template for commit messages

## What Gets Committed

The service automatically commits:
- Modified source files
- New files (excluding build artifacts)
- Configuration changes
- Documentation updates

## What Gets Excluded

The service automatically excludes:
- `node_modules/` - Dependencies
- `.next/`, `out/`, `dist/` - Build outputs
- `*.log` - Log files
- `*.exe`, `*.dmg`, etc. - Executable files
- `.git/` - Git metadata
- `auto-commit.log` - Auto-commit logs

## Logging

All auto-commit activities are logged to `auto-commit.log`:
- Commit timestamps
- Files added/modified
- Error messages
- Service start/stop events

## Stopping the Service

- **Windows**: Press `Ctrl+C` in the command window
- **PowerShell**: Press `Ctrl+C` in the PowerShell window
- **Node.js**: Press `Ctrl+C` in the terminal

## Troubleshooting

### Service Won't Start
1. Ensure Node.js is installed: `node --version`
2. Ensure Git is installed: `git --version`
3. Ensure you're in a git repository: `git status`

### No Commits Being Made
1. Check if there are changes: `git status`
2. Check the log file: `auto-commit.log`
3. Verify exclusion patterns in `auto-commit.config.json`

### Too Many Commits
1. Increase `commitInterval` in `auto-commit.config.json`
2. Add more patterns to `excludePatterns`
3. Set `maxCommitsPerHour` limit

## Manual Commands

```bash
# Check git status
git status

# View recent commits
git log --oneline -10

# View auto-commit log
cat auto-commit.log

# Stop auto-commit and make manual commit
git add .
git commit -m "Manual commit message"
```

## Integration with Development Workflow

The auto-commit service is designed to work alongside your normal development workflow:

1. **Development**: Make changes to your code
2. **Auto-Commit**: Service automatically commits changes every 5 minutes
3. **Manual Commits**: You can still make manual commits for important milestones
4. **Pushing**: Use `git push` to sync with remote repositories

## Security Notes

- The service only commits to your local repository
- No sensitive data should be committed (use `.gitignore`)
- Review commits before pushing to remote repositories
- Consider using git hooks for additional validation

## Support

For issues or questions:
1. Check the `auto-commit.log` file
2. Review the configuration in `auto-commit.config.json`
3. Ensure all dependencies are properly installed
