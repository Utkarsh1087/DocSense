import { getDb } from "./mongodb";

export async function readDocs(): Promise<any[]> {
  try {
    const db = await getDb();
    // Return all documents sorted in reverse order of creation
    return db.collection("documents").find({}).sort({ _id: -1 }).toArray();
  } catch (error) {
    console.error("Error reading documents from MongoDB:", error);
    return [];
  }
}

export async function writeDocs(docs: any[]): Promise<void> {
  try {
    const db = await getDb();
    // Sync documents array to MongoDB collection
    await db.collection("documents").deleteMany({});
    if (docs.length > 0) {
      await db.collection("documents").insertMany(docs);
    }
  } catch (error) {
    console.error("Error writing documents to MongoDB:", error);
  }
}

// Format file size helper
export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
