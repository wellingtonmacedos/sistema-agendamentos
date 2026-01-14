const mongoose = require('mongoose');
const Salon = require('./src/models/Salon');
require('dotenv').config();

async function checkLink() {
    try {
        const uri = 'mongodb://localhost:27017/agendamentos';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected.');
        
        const count = await Salon.countDocuments();
        console.log('Salon count:', count);

        if (count === 0) {
            console.log('No salons found.');
        } else {
            const salon = await Salon.findOne({});
            console.log('Found salon:', salon.name);
            console.log('Direct DB Access - chatbotLink:', salon.chatbotLink);
            
            // Simulating what the API returns
            const json = salon.toJSON();
            console.log('JSON Output - chatbotLink:', json.chatbotLink);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkLink();
