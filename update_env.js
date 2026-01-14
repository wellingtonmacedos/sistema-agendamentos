const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const frontendUrl = 'https://reservo.app.br';

try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (!envContent.includes('FRONTEND_URL=')) {
        console.log('Adding FRONTEND_URL...');
        // Ensure we start on a new line
        const prefix = envContent.endsWith('\n') ? '' : '\n';
        fs.appendFileSync(envPath, `${prefix}FRONTEND_URL=${frontendUrl}\n`);
    } else {
        console.log('FRONTEND_URL already exists.');
    }
    
    console.log('Done.');

} catch (err) {
    console.error('Error updating .env:', err);
}
