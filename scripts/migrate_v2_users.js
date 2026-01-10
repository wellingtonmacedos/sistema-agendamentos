const mongoose = require('mongoose');
require('dotenv').config();
const Salon = require('../src/models/Salon');
const User = require('../src/models/User');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_agendamentos');
        console.log('Connected to MongoDB');

        const salons = await Salon.find({});
        console.log(`Found ${salons.length} salons to check.`);

        for (const salon of salons) {
            // Check if user already exists for this salon email
            const existingUser = await User.findOne({ email: salon.email });
            
            if (!existingUser) {
                console.log(`Migrating salon: ${salon.name} (${salon.email})`);
                
                const newUser = new User({
                    name: `Admin ${salon.name}`, // Default name
                    email: salon.email,
                    password: salon.password, // Keep the hashed password
                    role: salon.role || 'ADMIN',
                    salonId: salon._id,
                    active: salon.active
                });

                await newUser.save();
                console.log(`User created for salon: ${salon.name}`);
            } else {
                console.log(`User already exists for email: ${salon.email}`);
                // Ensure salonId is linked if missing (e.g. for super admin who might not have salonId?)
                if (!existingUser.salonId && existingUser.role !== 'SUPER_ADMIN') {
                    existingUser.salonId = salon._id;
                    await existingUser.save();
                    console.log(`Linked existing user to salon: ${salon.name}`);
                }
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrate();
