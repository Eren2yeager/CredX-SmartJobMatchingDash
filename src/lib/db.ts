import mongoose from "mongoose";

// ponytail: global cache survives Next.js hot-reload; ceiling: single process only
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  (global as any).__mongooseCache ?? { conn: null, promise: null };
(global as any).__mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose.connection> {
  if (cached.conn) return cached.conn.connection;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) cached.promise = mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn.connection;
}
