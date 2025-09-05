const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3001;

// Serve static files from the out directory
app.use(express.static(path.join(__dirname, '../out')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../out/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
