const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Salon = require('../src/models/Salon');

async function migrateSlugs() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const salons = await Salon.find({ active: true });
    console.log(`Found ${salons.length} active salons.`);

    let updatedCount = 0;

    for (const salon of salons) {
      if (!salon.slug) {
        console.log(`Generating slug for salon: ${salon.name} (${salon._id})`);
        
        // Trigger pre-save middleware which generates the slug
        // We need to mark 'slug' as modified or just save, but since it's missing, save() should trigger the logic I added to pre('save')
        // However, the pre-save logic checks: if (!this.slug && this.name)
        // So simply saving should work.
        
        try {
            await salon.save();
            console.log(`Updated salon ${salon.name} with slug: ${salon.slug}`);
            updatedCount++;
        } catch (err) {
            console.error(`Failed to update salon ${salon.name}:`, err.message);
        }
      } else {
        console.log(`Salon ${salon.name} already has slug: ${salon.slug}`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} salons.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSlugs();
