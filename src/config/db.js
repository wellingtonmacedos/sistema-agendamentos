const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos';
    console.log(`Attempting to connect to MongoDB at: ${mongoURI.includes('@') ? 'Configured URI' : mongoURI}...`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    
    console.log('MongoDB Connected Successfully (Persistent)');
    return 'persistent';
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);

    // CRITICAL: In production, we should NOT fall back to in-memory DB as it causes data loss.
    // Only use in-memory if explicitly allowed or in development/test.
    const isProduction = process.env.NODE_ENV === 'production';
    const allowMemoryDB = process.env.USE_MEMORY_DB === 'true';

    if (isProduction && !allowMemoryDB) {
        console.error('FATAL: Could not connect to persistent MongoDB in production.');
        console.error('To prevent data loss, the server will not start with an in-memory database.');
        console.error('Please check your MONGO_URI or ensure MongoDB is running locally.');
        process.exit(1); // Exit to prevent silent data loss
    }

    console.log('---------------------------------------------------------');
    console.log('WARNING: Falling back to In-Memory Database (mongodb-memory-server).');
    console.log('DATA WILL BE LOST WHEN THE SERVER RESTARTS.');
    console.log('This is acceptable for development/testing, but NOT for production.');
    console.log('---------------------------------------------------------');

    try {
        const mongoServer = await MongoMemoryServer.create();
        global.__MONGO_SERVER__ = mongoServer;
        
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('MongoDB Connected (In-Memory Temporary Instance)');
        return 'memory';
    } catch (memErr) {
        console.error('Fatal: Could not start any database.', memErr);
        process.exit(1);
    }
  }
};

module.exports = connectDB;