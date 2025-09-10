# Enterprise Lead Management System - Development Workflow

## 🚀 Quick Start Guide

### 1. **Start Development Server**
```bash
npm run dev
```
Your app will be available at `http://localhost:3000`

### 2. **Start Auto-Commit Service**
```bash
npm run auto-commit:start
```
This automatically commits your changes every 5 minutes.

### 3. **Build for Production**
```bash
npm run build
npm run start
```

### 4. **Build Electron App**
```bash
npm run build-electron
```

## 📋 Daily Development Workflow

### Morning Setup
1. **Pull latest changes**: `git pull origin main`
2. **Start development server**: `npm run dev`
3. **Start auto-commit**: `npm run auto-commit:start`
4. **Open browser**: Navigate to `http://localhost:3000`

### During Development
- **Make changes** to your code
- **Auto-commit** handles saving your work every 5 minutes
- **Manual commits** for important milestones: `git commit -m "Feature: Add new functionality"`
- **Test changes** in browser

### End of Day
1. **Push changes**: `git push origin main`
2. **Stop auto-commit**: Press `Ctrl+C` in auto-commit terminal
3. **Stop dev server**: Press `Ctrl+C` in dev server terminal

## 🔧 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run lint:check` | Check for linting errors |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean build directories |
| `npm run electron` | Run Electron app |
| `npm run electron-dev` | Run Electron in development mode |
| `npm run build-electron` | Build Electron app |
| `npm run auto-commit` | Start auto-commit service |
| `npm run auto-commit:start` | Start auto-commit (Windows) |

## 📁 Project Structure

```
Sales-Funnel-CM/
├── app/                    # Next.js app directory
│   ├── add-lead/          # Add new lead page
│   ├── all-leads/         # View all leads page
│   ├── dashboard/         # Main dashboard
│   ├── due-today/         # Due today leads
│   ├── upcoming/          # Upcoming leads
│   ├── follow-up-mandate/ # Follow-up mandate page
│   ├── components/        # Reusable components
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   └── globals.css        # Global styles
├── electron/              # Electron main process
├── public/                # Static assets
├── dist/                  # Built Electron app
├── out/                   # Next.js static export
├── auto-commit.js         # Auto-commit service
├── auto-commit.config.json # Auto-commit configuration
└── package.json           # Project dependencies
```

## 🎯 Key Features

### Lead Management
- **Add Leads**: Create new leads with contact information
- **View All Leads**: Comprehensive lead listing with search/filter
- **Dashboard**: Overview of lead statistics and performance
- **Due Today**: Leads requiring immediate attention
- **Upcoming**: Scheduled follow-ups and appointments
- **Follow-up Mandate**: Automated follow-up system

### Technical Features
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **GSAP**: Advanced animations
- **Electron**: Desktop app support
- **Auto-commit**: Automated version control

## 🔄 Auto-Commit System

### What It Does
- **Automatically commits** changes every 5 minutes
- **Excludes build files** and dependencies
- **Logs all activity** to `auto-commit.log`
- **Works alongside** manual commits

### Configuration
Edit `auto-commit.config.json`:
```json
{
  "commitInterval": 300000,  // 5 minutes
  "excludePatterns": [...],  // Files to ignore
  "maxCommitsPerHour": 12    // Rate limiting
}
```

### Manual Override
```bash
# Stop auto-commit and make manual commit
git add .
git commit -m "Important milestone"
git push origin main
```

## 🐛 Troubleshooting

### Development Server Issues
```bash
# Clear Next.js cache
npm run clean
npm run dev

# Check for port conflicts
netstat -ano | findstr :3000
```

### Auto-Commit Issues
```bash
# Check auto-commit logs
type auto-commit.log

# Restart auto-commit service
npm run auto-commit:start
```

### Build Issues
```bash
# Clean and rebuild
npm run clean
npm run build

# Check TypeScript errors
npm run type-check
```

## 📊 Performance Monitoring

### Built-in Monitoring
- **Performance Monitor**: Real-time performance metrics
- **Activity Timeline**: Track user interactions
- **Virtual List**: Efficient large data rendering

### Development Tools
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety and IntelliSense
- **Hot Reload**: Instant development feedback

## 🚀 Deployment

### Web Deployment
1. **Build**: `npm run build`
2. **Export**: `npm run build` (creates `out/` directory)
3. **Deploy**: Upload `out/` to your web server

### Desktop App
1. **Build Electron**: `npm run build-electron`
2. **Installer**: Find installer in `dist/` directory
3. **Distribute**: Share installer with users

## 📝 Best Practices

### Code Organization
- **Components**: Keep components small and focused
- **Hooks**: Extract reusable logic into custom hooks
- **Context**: Use React Context for global state
- **Types**: Define TypeScript interfaces for data structures

### Git Workflow
- **Auto-commit**: Let the service handle regular saves
- **Manual commits**: Use for feature milestones
- **Branching**: Create feature branches for major changes
- **Pull requests**: Review code before merging

### Performance
- **Lazy loading**: Use dynamic imports for large components
- **Memoization**: Use React.memo for expensive components
- **Virtual scrolling**: Use VirtualList for large datasets
- **Image optimization**: Use Next.js Image component

## 🔗 Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run auto-commit:start      # Start auto-commit

# Building
npm run build                  # Build web app
npm run build-electron         # Build desktop app

# Quality
npm run lint                   # Fix linting issues
npm run type-check            # Check TypeScript

# Git
git status                    # Check repository status
git log --oneline -10        # View recent commits
git push origin main          # Push to remote

# Utilities
npm run clean                 # Clean build files
Get-Content auto-commit.log   # View auto-commit logs
```

## 📞 Support

- **Documentation**: Check `AUTO-COMMIT-README.md` for auto-commit details
- **Logs**: Check `auto-commit.log` for service activity
- **Git**: Use `git status` and `git log` for repository info
- **Issues**: Check console for development errors

---

**Happy Coding! 🎉**

Your Enterprise Lead Management System is fully set up with automated version control and a comprehensive development workflow.
