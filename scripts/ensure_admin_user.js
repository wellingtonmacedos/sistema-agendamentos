require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Salon = require('../src/models/Salon');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agendamento-db');
        console.log('MongoDB Conectado');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    }
};

const ensureAdmin = async () => {
    await connectDB();

    const email = 'admin@salao.com';
    const password = 'admin123';
    const name = 'Salão Premium';
    const userName = 'Admin User';
    const phone = '11999999999';

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Ensure Salon exists
        let salon = await Salon.findOne({ email });
        if (!salon) {
            salon = new Salon({
                name,
                email,
                password: 'deprecated', // Legacy
                phone,
                active: true,
                role: 'ADMIN'
            });
            await salon.save();
            console.log('Salon criado.');
        } else {
            // Update salon to be active if needed
            salon.active = true;
            await salon.save();
            console.log('Salon encontrado e ativado.');
        }

        // 2. Ensure User exists
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                name: userName,
                email,
                password: hashedPassword,
                salonId: salon._id,
                role: 'ADMIN',
                active: true
            });
            await user.save();
            console.log('User criado.');
        } else {
            user.password = hashedPassword;
            user.salonId = salon._id;
            user.active = true;
            user.role = 'ADMIN';
            await user.save();
            console.log('User atualizado (senha resetada).');
        }

        console.log('\n--- Credenciais de Acesso ---');
        console.log(`Email: ${email}`);
        console.log(`Senha: ${password}`);
        console.log('-----------------------------\n');

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

ensureAdmin();
