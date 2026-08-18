import { MongoClient, type MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {};

let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function build(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  return new MongoClient(uri, options).connect();
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) global._mongoClientPromise = build();
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = build();
}

export default clientPromise;
