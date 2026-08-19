import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
} else {
  // Defer throwing to runtime; do not crash during Next.js static build pre-generation
  clientPromise = Promise.resolve() as any;
}

export default clientPromise;

export async function getDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MONGODB_URI connection string to your Environment Variables.");
  }
  const connection = await clientPromise;
  return connection.db();
}
