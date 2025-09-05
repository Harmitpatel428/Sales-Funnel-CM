const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutoCommit {
    constructor() {
        this.watchPaths = [
            'app',
            'electron',
            'public',
            'package.json',
            'package-lock.json',
            'tsconfig.json',
            'next.config.ts',
            'eslint.config.mjs',
            'postcss.config.mjs',
            'README.md'
        ];
        this.ignorePaths = [
            'node_modules',
            '.git',
            '.next',
            'out',
            'dist',
            '*.log',
            '*.tmp',
            '*.cache'
        ];
        this.isCommitting = false;
        this.pendingChanges = new Set();
        this.commitTimeout = null;
    }

    // Check if file should be ignored
    shouldIgnore(filePath) {
        return this.ignorePaths.some(ignorePath => {
            if (ignorePath.includes('*')) {
                const pattern = ignorePath.replace(/\*/g, '.*');
                return new RegExp(pattern).test(filePath);
            }
            return filePath.includes(ignorePath);
        });
    }

    // Check if file is in watch paths
    shouldWatch(filePath) {
        return this.watchPaths.some(watchPath => {
            return filePath.startsWith(watchPath) || filePath === watchPath;
        });
    }

    // Execute git command
    execGit(command) {
        return new Promise((resolve, reject) => {
            exec(`git ${command}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Git error: ${error.message}`);
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    // Add file to pending changes
    addPendingChange(filePath) {
        if (this.shouldWatch(filePath) && !this.shouldIgnore(filePath)) {
            this.pendingChanges.add(filePath);
            this.scheduleCommit();
        }
    }

    // Schedule commit with debounce
    scheduleCommit() {
        if (this.commitTimeout) {
            clearTimeout(this.commitTimeout);
        }

        this.commitTimeout = setTimeout(() => {
            this.commitChanges();
        }, 2000); // Wait 2 seconds after last change
    }

    // Commit pending changes
    async commitChanges() {
        if (this.isCommitting || this.pendingChanges.size === 0) {
            return;
        }

        this.isCommitting = true;
        const changedFiles = Array.from(this.pendingChanges);
        this.pendingChanges.clear();

        try {
            console.log(`\n🔄 Auto-committing ${changedFiles.length} files...`);
            
            // Add all changed files
            await this.execGit(`add ${changedFiles.join(' ')}`);
            
            // Create commit message
            const timestamp = new Date().toLocaleString();
            const commitMessage = `Auto-commit: ${changedFiles.length} files updated at ${timestamp}`;
            
            // Commit changes
            await this.execGit(`commit -m "${commitMessage}"`);
            
            // Push to remote
            await this.execGit('push origin main');
            
            console.log(`✅ Successfully committed and pushed ${changedFiles.length} files`);
            console.log(`📁 Files: ${changedFiles.slice(0, 3).join(', ')}${changedFiles.length > 3 ? '...' : ''}`);
            
        } catch (error) {
            console.error('❌ Auto-commit failed:', error.message);
            // Re-add files to pending changes for retry
            changedFiles.forEach(file => this.pendingChanges.add(file));
        } finally {
            this.isCommitting = false;
        }
    }

    // Start watching for changes
    startWatching() {
        console.log('🚀 Starting auto-commit system...');
        console.log(`📁 Watching paths: ${this.watchPaths.join(', ')}`);
        console.log(`🚫 Ignoring: ${this.ignorePaths.join(', ')}`);
        console.log('⏰ Commit delay: 2 seconds after last change\n');

        this.watchPaths.forEach(watchPath => {
            if (fs.existsSync(watchPath)) {
                fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
                    if (filename && (eventType === 'change' || eventType === 'rename')) {
                        const fullPath = path.join(watchPath, filename);
                        console.log(`📝 Detected change: ${fullPath}`);
                        this.addPendingChange(fullPath);
                    }
                });
                console.log(`👀 Watching: ${watchPath}`);
            }
        });

        console.log('\n✨ Auto-commit system is now active!');
        console.log('💡 Any changes to your files will be automatically committed and pushed.');
        console.log('🛑 Press Ctrl+C to stop the auto-commit system.\n');
    }

    // Stop watching
    stopWatching() {
        console.log('\n🛑 Stopping auto-commit system...');
        if (this.commitTimeout) {
            clearTimeout(this.commitTimeout);
        }
        process.exit(0);
    }
}

// Initialize and start auto-commit system
const autoCommit = new AutoCommit();

// Handle graceful shutdown
process.on('SIGINT', () => {
    autoCommit.stopWatching();
});

process.on('SIGTERM', () => {
    autoCommit.stopWatching();
});

// Start the system
autoCommit.startWatching();
