const mongoose = require('mongoose');
const Appointment = require('./src/models/Appointment');
const Product = require('./src/models/Product');
require('dotenv').config();

const checkLastAppointment = async () => {
    try {
        // Correct DB name from server logs
        await mongoose.connect('mongodb://localhost:27017/sistema_agendamentos');
        console.log('Connected to MongoDB (sistema_agendamentos)');

        const lastApp = await Appointment.findOne({ status: 'completed' })
            .sort({ realEndTime: -1 })
            .populate('services')
            .populate('products.productId');

        if (!lastApp) {
            console.log('No completed appointments found.');
        } else {
            console.log('Last Appointment ID:', lastApp._id);
            console.log('Final Price:', lastApp.finalPrice);
            console.log('Products stored:', JSON.stringify(lastApp.products, null, 2));
            
            if (lastApp.products && lastApp.products.length > 0) {
                for (const p of lastApp.products) {
                    const prod = await Product.findById(p.productId);
                    console.log(`Product ${p.name} (ID: ${p.productId}) Stock: ${prod ? prod.stock : 'Not Found'}`);
                }
            }
        }

        const products = await Product.find({});
        console.log('All Products Count:', products.length);
        if (products.length > 0) {
             console.log('First product:', JSON.stringify(products[0], null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkLastAppointment();