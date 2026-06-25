import mongoose from "mongoose";

export const connectDB  = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Data base connected ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connect to database", error);
    process.exit(1);
  
  }
}