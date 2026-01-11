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

// Dynamic Manifest for PWA (specific salon)
app.get('/dynamic-manifest/:salonId', (req, res) => {
    const { salonId } = req.params;
    // Try to find manifest in dist (production) or public (dev fallback)
    let manifestPath = path.join(__dirname, '../frontend/dist/manifest-client.json');
    
    if (!fs.existsSync(manifestPath)) {
        manifestPath = path.join(__dirname, '../frontend/public/manifest-client.json');
    }

    fs.readFile(manifestPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Manifest read error:', err);
            return res.status(404).send('Manifest not found');
        }
        try {
            const json = JSON.parse(data);
            json.start_url = `/chat/${salonId}`;
            // Optional: You can also customize the name if you have salon info
            // json.name = `Agendamento - ${salonId}`; 
            res.json(json);
        } catch (e) {
            console.error('Manifest parse error:', e);
            res.status(500).send('Error parsing manifest');
        }
    });
});

// Catch-all handler for SPA (React)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;

console.log('Attempting to start server on port', PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
