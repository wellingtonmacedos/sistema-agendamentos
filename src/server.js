const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const path = require('path');

// Middleware
app.use(cors({
    exposedHeaders: ['x-arrival-order']
}));
app.use(express.json());

// Serve static files from React app (Frontend)
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/public', express.static(path.join(__dirname, '../public'))); // Keep old public as fallback or for specific assets

// Database Connection
connectDB().then(() => {
    // Seed admin user (useful for in-memory or fresh setups)
    require('./utils/seeder')();
    
    // Start Cron Service for Reminders
    require('./services/cronService').start();
});

// Routes
app.use('/api', apiRoutes);

// Catch-all handler for SPA (React)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;

console.log('Attempting to start server on port', PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
