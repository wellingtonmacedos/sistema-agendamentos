const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config();

// Connect to DB
const connectDB = require('./src/config/db');
const Salon = require('./src/models/Salon');

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const salons = await Salon.find({});
        console.log(`Found ${salons.length} salons.`);

        salons.forEach(s => {
            console.log('------------------------------------------------');
            console.log(`ID: ${s._id}`);
            console.log(`Name: ${s.name}`);
            console.log(`Email: ${s.email}`);
            console.log(`Slug: ${s.slug}`);
            console.log(`ChatbotLink (Virtual): ${s.chatbotLink}`);
            console.log('------------------------------------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
