import mongoose from "mongoose";

// Global cache survives Next.js hot reload; ceiling: single process only.
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};
const cached: MongooseCache = globalWithMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};
globalWithMongoose.__mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose.connection> {
  if (cached.conn) return cached.conn.connection;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) cached.promise = mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn.connection;
}
