import { getDb } from "./mongodb";

export async function readDocs(userId?: string): Promise<any[]> {
  try {
    const db = await getDb();
    const query = userId ? { userId } : {};
    return db.collection("documents").find(query).sort({ _id: -1 }).toArray();
  } catch (error) {
    console.error("Error reading documents from MongoDB:", error);
    return [];
  }
}

export async function insertDoc(doc: any): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("documents").insertOne(doc);
  } catch (error) {
    console.error("Error inserting document into MongoDB:", error);
    throw error;
  }
}

export async function deleteDocById(id: string, userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    const res = await db.collection("documents").deleteOne({ id, userId });
    return res.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting document from MongoDB:", error);
    throw error;
  }
}

// Backward-compatible alias for single-user arrays
export async function writeDocs(docs: any[]): Promise<void> {
  // Safe no-op if legacy callers pass docs array
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

