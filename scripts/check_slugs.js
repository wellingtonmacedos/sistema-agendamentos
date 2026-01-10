const mongoose = require('mongoose');
const fs = require('fs');
const Salon = require('../src/models/Salon');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/agendamentos');
        const salons = await Salon.find({});
        const data = salons.map(s => `${s.name}: ${s.slug}`).join('\n');
        fs.writeFileSync('slugs_check.txt', data);
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();