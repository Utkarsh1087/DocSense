import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

// Connection pool options sized for 500 concurrent connections on free-tier infra
const options: MongoClientOptions = {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In dev, use a global to preserve the connection across HMR reloads
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In prod, create a single connection that is reused
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // Defer throwing to runtime; do not crash during Next.js static build pre-generation
  clientPromise = Promise.resolve() as any;
}

export default clientPromise;

export async function getDb(dbName?: string) {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MONGODB_URI connection string to your Environment Variables.");
  }
  const connection = await clientPromise;
  return connection.db(dbName);
}

// Create indexes on first connect (idempotent)
export async function ensureIndexes() {
  try {
    const db = await getDb();
    // Users — fast lookup by email and id
    await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ id: 1 }, { unique: true, sparse: true });
    // Documents — fast lookup by userId
    await db.collection("documents").createIndex({ userId: 1 });
    await db.collection("documents").createIndex({ id: 1 });
    // Settings — keyed by userId
    await db.collection("settings").createIndex({ userId: 1 }, { unique: true, sparse: true });
    // Query logs — for analytics
    await db.collection("queryLogs").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("queryLogs").createIndex({ createdAt: -1 });
  } catch {
    // Non-fatal — indexes may already exist
  }
}
