#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  commitInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  logFile: 'auto-commit.log',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  excludePatterns: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'dist/**',
    '*.log',
    '.git/**',
    'auto-commit.log'
  ]
};

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  // Write to log file
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

// Check if there are changes to commit
function hasChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    log(`Error checking git status: ${error.message}`);
    return false;
  }
}

// Get staged files
function getStagedFiles() {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return staged.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    log(`Error getting staged files: ${error.message}`);
    return [];
  }
}

// Get unstaged files
function getUnstagedFiles() {
  try {
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' });
    return unstaged.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    log(`Error getting unstaged files: ${error.message}`);
    return [];
  }
}

// Get untracked files
function getUntrackedFiles() {
  try {
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' });
    return untracked.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    log(`Error getting untracked files: ${error.message}`);
    return [];
  }
}

// Check if file should be excluded
function shouldExcludeFile(filePath) {
  return CONFIG.excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

// Add files to git
function addFiles(files) {
  if (files.length === 0) return false;
  
  try {
    // Filter out excluded files
    const filesToAdd = files.filter(file => !shouldExcludeFile(file));
    
    if (filesToAdd.length === 0) {
      log('No files to add (all excluded)');
      return false;
    }
    
    execSync(`git add ${filesToAdd.join(' ')}`, { encoding: 'utf8' });
    log(`Added ${filesToAdd.length} files: ${filesToAdd.join(', ')}`);
    return true;
  } catch (error) {
    log(`Error adding files: ${error.message}`);
    return false;
  }
}

// Create commit
function createCommit() {
  try {
    const timestamp = new Date().toISOString();
    const commitMessage = `Auto-commit: ${timestamp}`;
    
    execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf8' });
    log(`Created commit: ${commitMessage}`);
    return true;
  } catch (error) {
    log(`Error creating commit: ${error.message}`);
    return false;
  }
}

// Push to remote repository
function pushToRemote() {
  try {
    execSync('git push', { encoding: 'utf8' });
    log('Successfully pushed to remote repository');
    return true;
  } catch (error) {
    log(`Error pushing to remote: ${error.message}`);
    return false;
  }
}

// Rotate log file if it gets too large
function rotateLogFile() {
  try {
    const stats = fs.statSync(CONFIG.logFile);
    if (stats.size > CONFIG.maxLogSize) {
      const backupFile = `${CONFIG.logFile}.backup`;
      fs.renameSync(CONFIG.logFile, backupFile);
      log('Log file rotated');
    }
  } catch (error) {
    // Log file doesn't exist or can't be rotated, that's okay
  }
}

// Main auto-commit function
function autoCommit() {
  log('Starting auto-commit check...');
  
  if (!hasChanges()) {
    log('No changes detected');
    return;
  }
  
  log('Changes detected, preparing commit...');
  
  // Get all types of changes
  const stagedFiles = getStagedFiles();
  const unstagedFiles = getUnstagedFiles();
  const untrackedFiles = getUntrackedFiles();
  
  log(`Staged files: ${stagedFiles.length}`);
  log(`Unstaged files: ${unstagedFiles.length}`);
  log(`Untracked files: ${untrackedFiles.length}`);
  
  // Add unstaged and untracked files
  const filesToAdd = [...unstagedFiles, ...untrackedFiles];
  const added = addFiles(filesToAdd);
  
  if (added || stagedFiles.length > 0) {
    const committed = createCommit();
    if (committed) {
      log('Auto-commit completed successfully');
      // Push to remote repository after successful commit
      pushToRemote();
    } else {
      log('Auto-commit failed');
    }
  } else {
    log('No files to commit');
  }
  
  // Rotate log file if needed
  rotateLogFile();
}

// Handle process termination
process.on('SIGINT', () => {
  log('Auto-commit stopped by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Auto-commit stopped by system');
  process.exit(0);
});

// Start auto-commit loop
log('Auto-commit service started');
log(`Commit interval: ${CONFIG.commitInterval / 1000} seconds`);

// Run immediately on start
autoCommit();

// Set up interval
const interval = setInterval(autoCommit, CONFIG.commitInterval);

// Keep the process running
process.on('exit', () => {
  clearInterval(interval);
  log('Auto-commit service stopped');
});
