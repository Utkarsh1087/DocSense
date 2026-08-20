import { getDb } from "./mongodb";
import crypto from "crypto";

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  plan: "Starter" | "Pro";
  createdAt: string;
  // Stripe billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Usage stats (incremented in real-time)
  queriesTotal?: number;
  queriesThisMonth?: number;
  documentsCount?: number;
  vectorsCount?: number;
  avgResponseMs?: number;
  lastActivity?: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ email: email.toLowerCase().trim() });
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ id });
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  const db = await getDb();
  const newUser: User = {
    ...user,
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    createdAt: new Date().toISOString(),
    queriesTotal: 0,
    queriesThisMonth: 0,
    documentsCount: 0,
    vectorsCount: 0,
    avgResponseMs: 0,
    lastActivity: new Date().toISOString(),
  };
  await db.collection("users").insertOne(newUser);
  return newUser;
}

export async function updateUserPlan(userId: string, plan: "Starter" | "Pro"): Promise<void> {
  const db = await getDb();
  await db.collection("users").updateOne({ id: userId }, { $set: { plan } });
}

export async function updateStripeInfo(
  userId: string,
  data: { stripeCustomerId?: string; stripeSubscriptionId?: string; plan?: "Starter" | "Pro" }
): Promise<void> {
  const db = await getDb();
  await db.collection("users").updateOne({ id: userId }, { $set: data });
}

export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ stripeCustomerId: customerId });
}

/**
 * Increment usage counters for a user.
 * @param userId - user id
 * @param type - what to increment
 * @param value - increment amount (default 1)
 */
export async function incrementUserStats(
  userId: string,
  type: "queries" | "documents" | "vectors",
  value = 1
): Promise<void> {
  const db = await getDb();
  const inc: Record<string, number> = {};
  if (type === "queries") {
    inc.queriesTotal = value;
    inc.queriesThisMonth = value;
  } else if (type === "documents") {
    inc.documentsCount = value;
  } else if (type === "vectors") {
    inc.vectorsCount = value;
  }

  await db.collection("users").updateOne(
    { id: userId },
    {
      $inc: inc,
      $set: { lastActivity: new Date().toISOString() },
    }
  );
}

/**
 * Update the rolling average response time for a user.
 */
export async function recordQueryLatency(userId: string, responseMs: number): Promise<void> {
  try {
    const db = await getDb();
    // Log for analytics
    await db.collection("queryLogs").insertOne({
      userId,
      responseMs,
      createdAt: new Date(),
    });
    // Update rolling average on user doc using exponential moving average
    const user = await findUserById(userId);
    if (user) {
      const current = user.avgResponseMs || 0;
      const alpha = 0.2; // smoothing factor
      const newAvg = current === 0 ? responseMs : Math.round(alpha * responseMs + (1 - alpha) * current);
      await db.collection("users").updateOne({ id: userId }, { $set: { avgResponseMs: newAvg } });
    }
  } catch {
    // Non-fatal
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}
