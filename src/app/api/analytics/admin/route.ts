import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb";

export const dynamic = "force-dynamic";

// Simple admin protection — only the first user or admin email can access
const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id") || "";

  // Basic admin check — add admin user IDs to ADMIN_USER_IDS env var
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = await getDb();

    const [totalUsers, proUsers, totalDocuments, vectorAgg, queryCount, latencyAgg] =
      await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("users").countDocuments({ plan: "Pro" }),
        db.collection("documents").countDocuments(),
        db.collection("documents").aggregate([
          { $group: { _id: null, totalVectors: { $sum: "$chunkCount" } } },
        ]).toArray(),
        db.collection("queryLogs").countDocuments(),
        db.collection("queryLogs").aggregate([
          { $group: { _id: null, avgMs: { $avg: "$responseMs" }, minMs: { $min: "$responseMs" } } },
        ]).toArray(),
      ]);

    const totalVectors = vectorAgg[0]?.totalVectors || 0;
    const platformAvgMs = Math.round(latencyAgg[0]?.avgMs || 0);
    const platformMinMs = Math.round(latencyAgg[0]?.minMs || 0);

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await db.collection("users").countDocuments({
      createdAt: { $gte: sevenDaysAgo.toISOString() },
    });

    return NextResponse.json({
      totalUsers,
      proUsers,
      starterUsers: totalUsers - proUsers,
      totalDocuments,
      totalVectors,
      totalQueries: queryCount,
      platformAvgMs,
      platformMinMs,
      recentSignups,
      pineconeCapacityPct: Math.round((totalVectors / 100000) * 100), // % of 100K free tier
      mongoCapacityPct: null, // Would need MongoDB Atlas API to get storage %, omit for now
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
