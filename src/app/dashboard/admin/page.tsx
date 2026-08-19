"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Activity, 
  Trash2, 
  UserMinus, 
  UserCheck, 
  Award, 
  RefreshCw, 
  Zap,
  Lock,
  Unlock
} from "lucide-react";
import Toast from "@/components/Toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: "Starter" | "Pro";
  status: "Active" | "Suspended";
  docsCount: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [activeModel, setActiveModel] = useState("gemini-1.5-flash");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load metrics & mock users
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Fetch real documents count
        const docsRes = await fetch("/api/documents");
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setTotalDocs(docs.length);
        }

        // 2. Fetch active model configuration
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setActiveModel(settingsData.settings.model || "gemini-1.5-flash");
        }

        // 3. Load or initialize mock users database in localStorage
        const storedUsers = localStorage.getItem("admin_users_db");
        const currentActiveUsername = localStorage.getItem("username") || "Admin User";
        const currentActivePlan = (localStorage.getItem("userPlan") as "Starter" | "Pro") || "Pro";

        if (storedUsers) {
          const parsed = JSON.parse(storedUsers) as UserProfile[];
          // Sync current active user's plan in user database
          const updated = parsed.map(u => {
            if (u.name === currentActiveUsername) {
              return { ...u, plan: currentActivePlan };
            }
            return u;
          });
          setUsers(updated);
          localStorage.setItem("admin_users_db", JSON.stringify(updated));
        } else {
          // Default mock database
          const defaultUsers: UserProfile[] = [
            { id: "1", name: "Utkarsh", email: "utkarsh@company.com", plan: "Pro", status: "Active", docsCount: 1 },
            { id: "2", name: "Guest User", email: "guest@docsense.io", plan: "Starter", status: "Active", docsCount: 2 },
            { id: "3", name: currentActiveUsername, email: "admin@docsense.io", plan: currentActivePlan, status: "Active", docsCount: 0 }
          ];
          setUsers(defaultUsers);
          localStorage.setItem("admin_users_db", JSON.stringify(defaultUsers));
        }
      } catch (err) {
        console.error("Failed to load admin metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const saveUsersToStorage = (updatedUsers: UserProfile[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("admin_users_db", JSON.stringify(updatedUsers));
  };

  const handlePlanToggle = (userId: string, newPlan: "Starter" | "Pro") => {
    const updated = users.map(user => {
      if (user.id === userId) {
        // If modifying currently logged in user, sync session localStorage
        const currentActiveUsername = localStorage.getItem("username") || "Admin User";
        if (user.name === currentActiveUsername) {
          localStorage.setItem("userPlan", newPlan);
          window.dispatchEvent(new Event("user-plan-change"));
        }
        return { ...user, plan: newPlan };
      }
      return user;
    });

    saveUsersToStorage(updated);
    setToastMessage(`Updated user plan successfully.`);
    setShowToast(true);
  };

  const handleStatusToggle = (userId: string, currentStatus: "Active" | "Suspended") => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    const updated = users.map(user => {
      if (user.id === userId) {
        return { ...user, status: newStatus as "Active" | "Suspended" };
      }
      return user;
    });

    saveUsersToStorage(updated);
    setToastMessage(`User status updated to ${newStatus}.`);
    setShowToast(true);
  };

  const handleResetDocs = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to reset documents count for ${name}?`)) {
      const updated = users.map(user => {
        if (user.id === userId) {
          return { ...user, docsCount: 0 };
        }
        return user;
      });
      saveUsersToStorage(updated);
      setToastMessage(`Document storage limits reset for ${name}.`);
      setShowToast(true);
    }
  };

  return (
    <div className="p-10 font-inter">
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        message={toastMessage}
      />

      {/* Header Panel */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="font-fustat font-bold text-4xl text-black tracking-tight mb-2 uppercase flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-black" />
            Admin Command Center
          </h1>
          <p className="text-sm font-medium text-black/40 font-inter">Global system statistics, account management variables, and execution parameters.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-black/40">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-bold font-schibsted uppercase tracking-widest">Loading metrics...</span>
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl pb-20">
          
          {/* Section 1: System Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Metric 1 */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/50">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block font-schibsted">Ingested PDFs</span>
                <span className="text-xl font-bold text-black font-schibsted">{totalDocs} Documents</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block font-schibsted">Active Model</span>
                <span className="text-xs font-bold text-black font-schibsted truncate max-w-[120px] block">{activeModel}</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block font-schibsted">Search Latency</span>
                <span className="text-xl font-bold text-black font-schibsted">&lt; 24ms</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block font-schibsted">Total Seats</span>
                <span className="text-xl font-bold text-black font-schibsted">{users.length} Active</span>
              </div>
            </div>

          </div>

          {/* Section 2: User Console Control Table */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Active System Users
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="py-4 text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40">Username</th>
                    <th className="py-4 text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40">Billing Tier</th>
                    <th className="py-4 text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40">Status</th>
                    <th className="py-4 text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 text-center">Docs Ingested</th>
                    <th className="py-4 text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-black/[0.01] transition-colors">
                      {/* Name / Email */}
                      <td className="py-4.5">
                        <span className="text-sm font-bold text-black block">{user.name}</span>
                        <span className="text-xs text-black/40 block font-inter">{user.email}</span>
                      </td>

                      {/* Tier dropdown selector */}
                      <td className="py-4.5">
                        <select
                          value={user.plan}
                          onChange={(e) => handlePlanToggle(user.id, e.target.value as "Starter" | "Pro")}
                          className="bg-white border border-black/5 rounded-xl px-3 py-1.5 text-xs font-bold text-black outline-none cursor-pointer shadow-xs"
                        >
                          <option value="Starter">Starter (Free)</option>
                          <option value="Pro">Pro ($12/mo)</option>
                        </select>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4.5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-schibsted border ${
                          user.status === "Active"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}>
                          {user.status}
                        </span>
                      </td>

                      {/* Document upload count */}
                      <td className="py-4.5 text-center font-schibsted font-bold text-sm text-black">
                        {user.name === localStorage.getItem("username") ? totalDocs : user.docsCount}
                      </td>

                      {/* Control buttons */}
                      <td className="py-4.5 text-right space-x-2">
                        {/* Suspend / Activate button */}
                        <button
                          onClick={() => handleStatusToggle(user.id, user.status)}
                          title={user.status === "Active" ? "Suspend Account" : "Activate Account"}
                          className={`p-2 rounded-xl border transition-all ${
                            user.status === "Active"
                              ? "border-black/5 text-black/40 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {user.status === "Active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        {/* Reset document count */}
                        <button
                          onClick={() => handleResetDocs(user.id, user.name)}
                          title="Reset Usage Limit"
                          className="p-2 rounded-xl border border-black/5 text-black/40 hover:bg-black/5 hover:text-black transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Quick Notice Panel */}
          <div className="bg-[#f8f8f8] border border-black/5 rounded-[24px] p-6 text-xs text-black/50 leading-relaxed font-inter">
            <span className="font-bold text-black block mb-1">Administrative Note:</span>
            Wiping or resetting document limits under this control panel operates on session states. No personal user credentials, passwords, or encrypted tokens are exposed or manipulated in accordance with platform security rules.
          </div>

        </div>
      )}

    </div>
  );
}
