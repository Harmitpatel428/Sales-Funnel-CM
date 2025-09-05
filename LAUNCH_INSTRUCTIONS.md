# 🚀 Sales Funnel - Desktop Application

## Quick Start (Smooth Operator Mode)

### Option 1: Desktop App (Recommended)
```bash
# Install dependencies
npm install

# Run in development mode
npm run electron-dev

# Build desktop application
npm run dist
```

### Option 2: Local Web Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to: http://localhost:3000
```

### Option 3: Static Files (No Server)
```bash
# Build static files
npm run build

# Serve static files (choose one):
# Using Python:
python -m http.server 3000

# Using Node.js:
npx serve out

# Using Live Server (VS Code extension):
# Right-click on out/index.html -> "Open with Live Server"
```

## 📦 Distribution Options

### 1. **Electron Desktop App** (Best for clients)
- Creates `.exe` installer for Windows
- Creates `.dmg` for Mac
- Creates `.AppImage` for Linux
- No internet required
- Professional desktop experience

### 2. **Portable Web App**
- Build static files (`npm run build`)
- Copy `out` folder to USB drive
- Client opens `index.html` in browser
- Works offline completely

### 3. **Local Network Server**
- Run `npm run dev` on your machine
- Share your IP address with client
- Client accesses via `http://YOUR_IP:3000`
- Real-time updates

## 🎯 Client Delivery Methods

### Method 1: USB Drive Package
```
📁 Sales-Funnel-Package/
├── 📁 Sales-Funnel-App/
│   ├── 📄 Sales-Funnel.exe (Windows)
│   ├── 📄 Sales-Funnel.dmg (Mac)
│   └── 📄 README.txt
├── 📁 Web-Version/
│   ├── 📁 out/
│   └── 📄 index.html
└── 📄 Installation-Guide.pdf
```

### Method 2: Cloud Delivery
- Upload to Google Drive/Dropbox
- Share download link
- Include installation instructions

### Method 3: Email Package
- Zip the built application
- Send via email (if under size limit)
- Include setup instructions

## 🔧 Technical Details

### Data Storage
- All data stored in browser's localStorage
- Data persists between sessions
- Export/Import functionality included
- No external database required

### System Requirements
- Windows 10/11, macOS 10.14+, or Linux
- 4GB RAM minimum
- 100MB disk space
- Modern web browser (for web version)

### Security Features
- Password-protected deletion
- Local data only (no cloud sync)
- Export/backup functionality
- Admin-only access controls

## 📋 Installation Guide for Client

### Desktop App Installation:
1. Download the installer file
2. Run the installer
3. Follow installation wizard
4. Launch "Sales Funnel" from desktop/start menu
5. Start managing leads immediately!

### Web Version Installation:
1. Extract the files to a folder
2. Double-click `index.html`
3. Bookmark the page for easy access
4. Use normally in browser

## 🆘 Troubleshooting

### If app won't start:
- Check system requirements
- Try running as administrator
- Disable antivirus temporarily
- Check Windows Defender exclusions

### If data is lost:
- Check browser's localStorage
- Look for backup exports
- Contact support with error details

### Performance issues:
- Close other applications
- Restart the application
- Clear browser cache (web version)
- Check available disk space

## 📞 Support
- All data is stored locally
- No internet connection required
- Export functionality for backups
- Password reset: Contact administrator

---
**Note**: This application runs completely offline and stores all data locally on the user's machine.
