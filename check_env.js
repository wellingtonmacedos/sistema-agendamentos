const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('--- .env content ---');
    console.log(envContent);
    console.log('--------------------');
} catch (err) {
    console.error('Error reading .env:', err);
}
