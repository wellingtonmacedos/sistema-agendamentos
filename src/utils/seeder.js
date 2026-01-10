const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Service = require('../models/Service');
const Professional = require('../models/Professional');

const seedAdmin = async () => {
    try {
        console.log('Seeder started...');
        const email = 'admin@salao.com';
        const password = 'admin123';
        const name = 'Salão Premium Admin';
        const phone = '11999999999';
        
        // Hardcoded ID to persist across server restarts (In-Memory DB)
        const ADMIN_ID = '507f1f77bcf86cd799439011';

        console.log('Checking for existing admin...');
        let salon = await Salon.findById(ADMIN_ID);
        
        if (!salon) {
            // Also check by email to avoid duplicates if ID check failed but email exists (edge case)
            salon = await Salon.findOne({ email });
        }

        if (!salon) {
            console.log('Seeding Admin User (Creating new)...');
            const salt = await bcrypt.genSalt(10);
            console.log('Salt generated');
            const hashedPassword = await bcrypt.hash(password, salt);
            console.log('Password hashed');

            salon = new Salon({
                _id: ADMIN_ID, // Force the ID
                name,
                email,
                password: hashedPassword,
                phone,
                workingHours: {
                  '1': { open: '09:00', close: '18:00', isOpen: true }, // Mon
                  '2': { open: '09:00', close: '18:00', isOpen: true }, // Tue
                  '3': { open: '09:00', close: '18:00', isOpen: true }, // Wed
                  '4': { open: '09:00', close: '18:00', isOpen: true }, // Thu
                  '5': { open: '09:00', close: '18:00', isOpen: true }, // Fri
                  '6': { open: '09:00', close: '18:00', isOpen: true }  // Sat
                }
            });

            await salon.save();
            console.log('--- Admin User Created ---');
            console.log(`ID: ${salon._id}`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.log('Admin user already exists.');
        }

        const existingAdminUser = await User.findOne({ email });
        if (!existingAdminUser) {
            await User.create({
                name: `Admin ${salon.name}`,
                email,
                password: salon.password,
                role: 'ADMIN',
                salonId: salon._id,
                active: true
            });
            console.log('--- Admin Auth User Created ---');
        } else {
            let changed = false;
            if (existingAdminUser.role !== 'ADMIN') {
                existingAdminUser.role = 'ADMIN';
                changed = true;
            }
            if (!existingAdminUser.salonId) {
                existingAdminUser.salonId = salon._id;
                changed = true;
            }
            if (existingAdminUser.password !== salon.password) {
                existingAdminUser.password = salon.password;
                changed = true;
            }
            if (existingAdminUser.active !== true) {
                existingAdminUser.active = true;
                changed = true;
            }
            if (changed) await existingAdminUser.save();
            console.log('Admin Auth User already exists.');
        }

        // Check and Seed Services
        const serviceCount = await Service.countDocuments({ salonId: salon._id });
        if (serviceCount === 0) {
            console.log('Seeding Services...');
            const services = [
                { name: 'Corte de Cabelo', price: 50, duration: 30, salonId: salon._id },
                { name: 'Barba', price: 30, duration: 20, salonId: salon._id },
                { name: 'Corte + Barba', price: 70, duration: 50, salonId: salon._id }
            ];
            await Service.insertMany(services);
            console.log('--- Services Created ---');
        } else {
            console.log('Services already exist.');
        }

        // Check and Seed Professionals
        const professionalCount = await Professional.countDocuments({ salonId: salon._id });
        if (professionalCount === 0) {
            console.log('Seeding Professionals...');
            const professionals = [
                { name: 'João Silva', salonId: salon._id },
                { name: 'Maria Santos', salonId: salon._id }
            ];
            await Professional.insertMany(professionals);
            console.log('--- Professionals Created ---');
        } else {
            console.log('Professionals already exist.');
        }

        // --- SUPER ADMIN SEEDING ---
        const SUPER_ADMIN_EMAIL = 'super@sistema.com';
        let superAdmin = await Salon.findOne({ email: SUPER_ADMIN_EMAIL });

        if (!superAdmin) {
            console.log('Seeding Super Admin User...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('super123', salt);

            superAdmin = new Salon({
                name: 'Super Admin System',
                email: SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                phone: '00000000000',
                role: 'SUPER_ADMIN',
                workingHours: {} // Empty as it doesn't take appointments
            });

            await superAdmin.save();
            console.log('--- Super Admin Created ---');
            console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
            console.log(`Password: super123`);
        } else {
             // Ensure role is correct if it exists
             if (superAdmin.role !== 'SUPER_ADMIN') {
                 superAdmin.role = 'SUPER_ADMIN';
                 await superAdmin.save();
                 console.log('Updated existing Super Admin role.');
             }
             console.log('Super Admin already exists.');
        }

        const existingSuperUser = await User.findOne({ email: SUPER_ADMIN_EMAIL });
        if (!existingSuperUser) {
            await User.create({
                name: 'Super Admin',
                email: SUPER_ADMIN_EMAIL,
                password: superAdmin.password,
                role: 'SUPER_ADMIN',
                salonId: superAdmin._id,
                active: true
            });
            console.log('--- Super Admin Auth User Created ---');
        } else {
            let changed = false;
            if (existingSuperUser.role !== 'SUPER_ADMIN') {
                existingSuperUser.role = 'SUPER_ADMIN';
                changed = true;
            }
            if (!existingSuperUser.salonId) {
                existingSuperUser.salonId = superAdmin._id;
                changed = true;
            }
            if (existingSuperUser.password !== superAdmin.password) {
                existingSuperUser.password = superAdmin.password;
                changed = true;
            }
            if (existingSuperUser.active !== true) {
                existingSuperUser.active = true;
                changed = true;
            }
            if (changed) await existingSuperUser.save();
            console.log('Super Admin Auth User already exists.');
        }

    } catch (err) {
        console.error('Seeding error:', err);
    }
};

module.exports = seedAdmin;
