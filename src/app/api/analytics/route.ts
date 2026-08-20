import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { findUserById } from "../../../lib/userHelpers";
import { getUserIdFromRequest, getPlanFromRequest } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const userPlan = getPlanFromRequest(req);
    const db = await getDb();

    // Get user data
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Documents count for this user
    const documentsCount = await db.collection("documents").countDocuments({ userId });

    // Total vectors for this user (sum of chunkCount across all docs)
    const vectorAgg = await db.collection("documents").aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalVectors: { $sum: "$chunkCount" } } },
    ]).toArray();
    const vectorsCount = vectorAgg[0]?.totalVectors || 0;

    // Query stats — last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const queriesThisMonth = await db.collection("queryLogs").countDocuments({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Average response time (last 50 queries)
    const latencyAgg = await db.collection("queryLogs").aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      { $group: { _id: null, avgMs: { $avg: "$responseMs" }, minMs: { $min: "$responseMs" } } },
    ]).toArray();
    const avgResponseMs = Math.round(latencyAgg[0]?.avgMs || 0);
    const minResponseMs = Math.round(latencyAgg[0]?.minMs || 0);

    // Daily query trend — last 7 days (Pro only)
    let queryTrend: { date: string; count: number }[] = [];
    if (userPlan === "Pro") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const trendAgg = await db.collection("queryLogs").aggregate([
        { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();
      queryTrend = trendAgg.map((d) => ({ date: d._id, count: d.count }));
    }

    // Plan limits
    const planLimits = {
      Starter: { documents: 3, queriesPerMin: 15, topK: 3 },
      Pro: { documents: -1, queriesPerMin: 60, topK: 10 },
    };

    return NextResponse.json({
      userId,
      plan: userPlan,
      documentsCount,
      vectorsCount,
      queriesThisMonth,
      queriesTotal: user.queriesTotal || 0,
      avgResponseMs,
      minResponseMs,
      queryTrend,
      lastActivity: user.lastActivity || null,
      planLimits: planLimits[userPlan],
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
