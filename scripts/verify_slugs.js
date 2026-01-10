const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Salon = require('../src/models/Salon');

const fs = require('fs');

async function verifySlugs() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos';
    await mongoose.connect(mongoURI);
    
    let output = 'Connected to MongoDB\n';

    const salons = await Salon.find({ active: true });
    output += `Found ${salons.length} active salons.\n`;

    for (const salon of salons) {
        console.log(`--------------------------------------------------`);
        console.log(`Name: ${salon.name}`);
        console.log(`ID: ${salon._id}`);
        console.log(`Slug: ${salon.slug}`);
        console.log(`Chatbot Link: ${salon.chatbotLink}`);
        
        if (!salon.slug) {
            console.error('ERROR: Missing slug!');
        }
    }
    
    // fs.writeFileSync('verify_output.txt', output);
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifySlugs();
