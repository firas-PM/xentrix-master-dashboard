import mongoose from "mongoose";

// Cache the connection across hot reloads in dev and across warm Fluid Compute
// invocations in prod. A single mongoose connection is reused per instance.
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as unknown as { _mongoose?: Cached };
const cached: Cached =
  globalWithMongoose._mongoose ?? { conn: null, promise: null };
globalWithMongoose._mongoose = cached;

export async function connectDb() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
