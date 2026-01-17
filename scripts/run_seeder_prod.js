const dotenv = require('dotenv');
const connectDB = require('../src/config/db');
const seedAdmin = require('../src/utils/seeder');

dotenv.config();

(async () => {
  try {
    await connectDB();
    await seedAdmin();
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
})();

