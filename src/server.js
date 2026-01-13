const express = require('express');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const Salon = require('./models/Salon');

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

// Catch-all handler for SPA (React) with Dynamic Meta Tags
app.get('*', async (req, res) => {
    const filePath = path.join(__dirname, '../frontend/dist/index.html');
    
    // Check if it's a chat route
    const chatMatch = req.path.match(/^\/chat\/([^\/]+)/);
    
    if (chatMatch) {
        const slug = chatMatch[1];
        try {
            const salon = await Salon.findOne({ slug });
            
            if (salon) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error('Error reading index.html:', err);
                        return res.status(500).send('Error loading page');
                    }
                    
                    let html = data;
                    
                    // Dynamic Values
                    const title = `${salon.name} - Reservo - Agenda Inteligente`;
                    const description = `Agende seu horário online no ${salon.name}. Rápido, fácil e prático.`;
                    // Prioritize avatar, then logo, then default
                    const image = salon.chatConfig?.avatarUrl || salon.logo || `https://${req.get('host')}/Reservo-icon.png`; 
                    
                    // Replace Title
                    html = html.replace(
                        /<title>.*?<\/title>/, 
                        `<title>${title}</title>`
                    );
                    
                    // Meta Tags to Inject
                    const metaTags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="https://${req.get('host')}${req.originalUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
                    `;
                    
                    // Inject before </head>
                    html = html.replace('</head>', `${metaTags}</head>`);
                    
                    return res.send(html);
                });
                return; // Stop execution here
            }
        } catch (error) {
            console.error('Error fetching salon for meta tags:', error);
            // Continue to default serve on error
        }
    }

    res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;

console.log('Attempting to start server on port', PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
