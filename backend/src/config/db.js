import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  // Check if we already have a connection to the database
  if (mongoose.connections && mongoose.connections[0] && mongoose.connections[0].readyState) {
    isConnected = true;
    console.log('MongoDB: Reusing existing database connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview_prep', {
      bufferCommands: false, // Disable Mongoose buffering to prevent timeouts during transient drops
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
