const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Salon = require('../src/models/Salon');

async function debugSlugs() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos';
    await mongoose.connect(mongoURI);
    
    let output = 'Connected to MongoDB\n';

    const salons = await Salon.find({ active: true });
    output += `Found ${salons.length} active salons.\n`;

    for (const salon of salons) {
        output += `--------------------------------------------------\n`;
        output += `Name: ${salon.name}\n`;
        output += `ID: ${salon._id}\n`;
        output += `Slug: ${salon.slug}\n`;
        output += `Chatbot Link: ${salon.chatbotLink}\n`;
    }
    
    fs.writeFileSync('debug_output.txt', output);
    console.log('Debug output written to debug_output.txt');
    process.exit(0);
  } catch (error) {
    console.error('Debug failed:', error);
    process.exit(1);
  }
}

debugSlugs();
