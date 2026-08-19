import { getDb } from "./mongodb";
import crypto from "crypto";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  plan: "Starter" | "Pro";
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ email: email.toLowerCase().trim() });
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  const db = await getDb();
  const newUser: User = {
    ...user,
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await db.collection("users").insertOne(newUser);
  return newUser;
}

export async function updateUserPlan(userId: string, plan: "Starter" | "Pro"): Promise<void> {
  const db = await getDb();
  await db.collection("users").updateOne({ id: userId }, { $set: { plan } });
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}
