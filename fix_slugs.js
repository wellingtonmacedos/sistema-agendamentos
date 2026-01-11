const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

// Connect to DB
const connectDB = require('./src/config/db');
const Salon = require('./src/models/Salon');

const run = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const salons = await Salon.find({ slug: { $exists: false } });
        console.log(`Found ${salons.length} salons without slug.`);

        for (const salon of salons) {
            console.log(`Updating salon: ${salon.name} (${salon._id})`);
            // The pre-save hook will generate the slug
            await salon.save();
            console.log(`  -> New slug: ${salon.slug}`);
        }

        // Double check just in case
        const salonsWithNullSlug = await Salon.find({ slug: null });
        if (salonsWithNullSlug.length > 0) {
             console.log(`Found ${salonsWithNullSlug.length} salons with null slug.`);
             for (const salon of salonsWithNullSlug) {
                console.log(`Updating salon (null slug): ${salon.name} (${salon._id})`);
                await salon.save();
                console.log(`  -> New slug: ${salon.slug}`);
             }
        }
        
        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
