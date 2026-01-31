import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    // Allow running with mock data only (no DB) for local UI testing
    if (process.env.SKIP_DB === 'true') {
      console.warn('⚠️  SKIP_DB=true: skipping MongoDB connection');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel-booking';

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    if (process.env.ALLOW_DB_FAIL === 'true') {
      console.warn('Continuing without DB because ALLOW_DB_FAIL=true');
      return;
    }
    process.exit(1);
  }
};