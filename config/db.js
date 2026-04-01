import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_FALLBACK_URI;

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Primary MongoDB connection failed: ${error.message}`);

    if (!fallbackUri) {
      console.error('No fallback database configured. Add MONGO_FALLBACK_URI or allow your IP in MongoDB Atlas Network Access.');
      process.exit(1);
    }

    try {
      const fallbackConn = await mongoose.connect(fallbackUri);
      console.log(`MongoDB Fallback Connected: ${fallbackConn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Fallback MongoDB connection failed: ${fallbackError.message}`);
      console.error('Fix Atlas IP access or run a local MongoDB server for the fallback URI.');
      process.exit(1);
    }
  }
};

export default connectDB;
