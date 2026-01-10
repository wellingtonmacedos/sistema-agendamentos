const mongoose = require('mongoose');
require('dotenv').config();

// Define schema inline to avoid model compilation issues
const auditLogSchema = new mongoose.Schema({
    performedByModel: String,
    targetModel: String
}, { strict: false });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function migrateAuditLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agendamento-db');
        console.log('Connected to MongoDB');

        const result = await AuditLog.updateMany(
            { performedByModel: { $exists: false } },
            { $set: { performedByModel: 'Salon', targetModel: 'Salon' } }
        );

        console.log(`Updated ${result.modifiedCount} audit logs.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateAuditLogs();
