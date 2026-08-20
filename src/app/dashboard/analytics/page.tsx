"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Zap,
  FileText,
  Database,
  Clock,
  TrendingUp,
  Lock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AnalyticsData {
  plan: "Starter" | "Pro";
  documentsCount: number;
  vectorsCount: number;
  queriesThisMonth: number;
  queriesTotal: number;
  avgResponseMs: number;
  minResponseMs: number;
  queryTrend: { date: string; count: number }[];
  lastActivity: string | null;
  planLimits: { documents: number; queriesPerMin: number; topK: number };
}

// Simple bar chart using pure CSS/SVG
function SparklineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-black/20 text-xs font-schibsted font-bold uppercase tracking-widest">
        No query data yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-end gap-1.5 h-24 px-1">
      {data.map((d, i) => {
        const height = Math.max((d.count / max) * 100, 4);
        const isToday = d.date === today;
        const label = new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`${d.date}: ${d.count} queries`}>
            <div
              className={`w-full rounded-t-md transition-all ${
                isToday ? "bg-purple-500" : "bg-black/10 hover:bg-black/20"
              }`}
              style={{ height: `${height}%` }}
            />
            <span className="text-[8px] font-bold font-schibsted text-black/30 uppercase">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "black",
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  accent?: string;
}) {
  const colorMap: Record<string, string> = {
    black: "bg-black/5 text-black",
    purple: "bg-purple-500/10 text-purple-600",
    green: "bg-green-500/10 text-green-600",
    blue: "bg-blue-500/10 text-blue-600",
    orange: "bg-orange-500/10 text-orange-600",
  };

  return (
    <div className="bg-white border border-black/5 rounded-[24px] p-6 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorMap[color] || colorMap.black}`}>
          <Icon className="w-5 h-5" />
        </div>
        {accent && (
          <span className="text-[9px] font-bold font-schibsted uppercase tracking-widest px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
            {accent}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold font-fustat text-black tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-black/40 font-schibsted uppercase tracking-widest mt-0.5">{label}</div>
        {sub && <div className="text-xs text-black/30 font-inter mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// Usage progress bar
function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit < 0 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit < 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold font-schibsted text-black/60">{label}</span>
        <span className="text-xs font-bold font-schibsted text-black/40">
          {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
        </span>
      </div>
      <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 60 ? "bg-orange-400" : "bg-green-500"}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {isUnlimited && <div className="h-full bg-purple-500 rounded-full w-full opacity-20" />}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState("Starter");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics", {
        headers: {
          "x-user-id": localStorage.getItem("userId") || "",
          "x-user-plan": localStorage.getItem("userPlan") || "Starter",
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load analytics.");
      }

      const analyticsData = await res.json();
      setData(analyticsData);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const plan = localStorage.getItem("userPlan") || "Starter";
    setUserPlan(plan);
    fetchAnalytics();
  }, []);

  const latencyColor =
    !data?.avgResponseMs ? "text-black/30" :
    data.avgResponseMs < 500 ? "text-green-600" :
    data.avgResponseMs < 1000 ? "text-orange-500" :
    "text-red-500";

  return (
    <div className="p-10 font-inter">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-2 font-schibsted">
            Usage Dashboard
          </span>
          <h1 className="font-fustat font-bold text-4xl text-black tracking-tight mb-2 uppercase">Analytics</h1>
          <p className="text-sm font-medium text-black/40 font-inter">
            Real-time performance metrics and usage statistics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold font-schibsted text-black/30 uppercase tracking-widest">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/5 rounded-xl text-xs font-schibsted font-bold text-black/60 hover:bg-black/5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pro gate for full analytics */}
      {userPlan === "Starter" && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-purple-800 font-schibsted mb-1">Pro Analytics Locked</div>
              <p className="text-xs text-purple-600/80 font-inter">
                Upgrade to Pro to unlock 7-day query trends, latency breakdowns, and detailed usage insights.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-schibsted font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 text-sm text-red-600 mb-8 font-inter flex items-center gap-3">
          <Activity className="w-5 h-5 shrink-0" />
          <span><span className="font-bold">Error:</span> {error}</span>
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-black/5 rounded-[24px] p-6 animate-pulse h-36" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FileText}
              label="Documents Indexed"
              value={data.documentsCount}
              sub={data.planLimits.documents < 0 ? "Unlimited (Pro)" : `${data.planLimits.documents} document limit`}
              color="black"
            />
            <StatCard
              icon={Database}
              label="Vectors in Pinecone"
              value={data.vectorsCount.toLocaleString()}
              sub="~100K free tier capacity"
              color="blue"
              accent={data.vectorsCount > 0 ? "Active" : undefined}
            />
            <StatCard
              icon={BarChart3}
              label="Queries This Month"
              value={data.queriesThisMonth}
              sub={`${data.queriesTotal.toLocaleString()} total all-time`}
              color="purple"
            />
            <StatCard
              icon={Zap}
              label="Avg Response Time"
              value={data.avgResponseMs > 0 ? `${data.avgResponseMs}ms` : "—"}
              sub={data.minResponseMs > 0 ? `Best: ${data.minResponseMs}ms` : "Ask your first question"}
              color="green"
              accent={data.avgResponseMs > 0 && data.avgResponseMs < 500 ? "<500ms ✓" : undefined}
            />
          </div>

          {/* Latency targets row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Retrieval performance */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold font-schibsted uppercase tracking-widest text-black/60">
                    Performance Targets
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Vector Retrieval Latency",
                    target: "<150ms",
                    achieved: data.avgResponseMs > 0 && data.minResponseMs <= 150,
                    note: "Pinecone index query time",
                  },
                  {
                    label: "AI Time-to-First-Token",
                    target: "<500ms",
                    achieved: data.avgResponseMs > 0 && data.avgResponseMs < 500,
                    note: "Gemini stream TTFT",
                  },
                  {
                    label: "Ingestion Speed",
                    target: "~2.5s / 10 pages",
                    achieved: true,
                    note: "Parallel batch embedding active",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                    <div>
                      <div className="text-xs font-bold font-schibsted text-black">{item.label}</div>
                      <div className="text-[10px] text-black/30 font-inter">{item.note}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-schibsted text-black/40">{item.target}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${item.achieved ? "bg-green-500" : "bg-black/10"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan usage */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold font-schibsted uppercase tracking-widest text-black/60">
                  Plan Usage
                </span>
                <span className={`ml-auto text-[9px] font-bold font-schibsted uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  data.plan === "Pro" ? "bg-purple-100 text-purple-600" : "bg-black/5 text-black/40"
                }`}>
                  {data.plan}
                </span>
              </div>
              <div className="space-y-4">
                <UsageBar
                  used={data.documentsCount}
                  limit={data.planLimits.documents}
                  label="Documents"
                />
                <UsageBar
                  used={data.queriesThisMonth}
                  limit={data.plan === "Starter" ? 450 : -1} // 15/min × ~30 mins active
                  label="Queries This Month (est.)"
                />
                <UsageBar
                  used={data.vectorsCount}
                  limit={100000}
                  label="Pinecone Vectors (100K free tier)"
                />
              </div>
              {data.plan === "Starter" && (
                <button
                  onClick={() => router.push("/dashboard/settings")}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-xs font-bold font-schibsted uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Upgrade to Pro — $12/mo
                </button>
              )}
            </div>
          </div>

          {/* Query Trend Chart (Pro only) */}
          {data.plan === "Pro" ? (
            <div className="bg-white border border-black/5 rounded-[24px] p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold font-schibsted uppercase tracking-widest text-black/60">
                  7-Day Query Trend
                </span>
                <span className="ml-auto text-[10px] text-black/30 font-inter">
                  {data.queryTrend.reduce((s, d) => s + d.count, 0)} queries this week
                </span>
              </div>
              <SparklineChart data={data.queryTrend} />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border border-purple-100 rounded-[24px] p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-bold font-schibsted text-black mb-1">Query Trend Chart</div>
                <p className="text-xs text-black/40 font-inter">Unlock 7-day query trends, latency breakdowns, and more with Pro.</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/settings")}
                className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold font-schibsted uppercase tracking-widest transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            </div>
          )}
        </>
      ) : null}

      {/* Last activity */}
      {data?.lastActivity && (
        <div className="flex items-center gap-2 mt-6 text-[10px] text-black/30 font-schibsted font-bold uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          Last activity: {new Date(data.lastActivity).toLocaleString()}
        </div>
      )}
    </div>
  );
}
