import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB ?? "reactquiz" });
  // eslint-disable-next-line no-console
  console.log("[api] connected to mongodb");
}
