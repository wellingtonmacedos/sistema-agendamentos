const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos';
    console.log(`Attempting to connect to MongoDB at: ${mongoURI.includes('@') ? 'Configured URI' : mongoURI}...`);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('MongoDB Connected Successfully (Persistent)');
    return 'persistent';
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
