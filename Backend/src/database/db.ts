import mongoose from "mongoose";

export const connectMongo = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("====================");
    console.log("MongoDB Connected");
  } catch (error: any) {
    console.error("!!!!! MongoDB Connection Error !!!!!", error);
    process.exit(1);
  }
};
