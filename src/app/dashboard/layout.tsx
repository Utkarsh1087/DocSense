"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderOpen, 
  BarChart3, 
  Users, 
  Settings, 
  MessageSquare, 
  Search as SearchIcon,
  Plus,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { icon: <FolderOpen className="w-5 h-5" />, label: "Library", path: "/dashboard", comingSoon: false },
  { icon: <MessageSquare className="w-5 h-5" />, label: "Chat", path: "/dashboard/chat", comingSoon: false },
  { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", path: "/dashboard/analytics", comingSoon: true },
  { icon: <Users className="w-5 h-5" />, label: "Team", path: "/dashboard/team", comingSoon: true },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathnameHook = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("Admin");
  const [userPlan, setUserPlan] = useState("Starter");
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(pathnameHook);
  }, [pathnameHook]);

  useEffect(() => {
    const loadProfile = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!loggedIn) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      setUsername(localStorage.getItem("username") || "Admin");
      setUserPlan(localStorage.getItem("userPlan") || "Starter");
    };
    loadProfile();
    window.addEventListener("user-profile-change", loadProfile);
    window.addEventListener("user-plan-change", loadProfile);
    return () => {
      window.removeEventListener("user-profile-change", loadProfile);
      window.removeEventListener("user-plan-change", loadProfile);
    };
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPlan");
    localStorage.removeItem("docsense_token");
    
    // Clear cookies
    document.cookie = "docsense_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "docsense_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    window.dispatchEvent(new Event("login-state-change"));
    router.push("/");
  };


  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-black/5 flex flex-col p-6">
        <div className="mb-12 px-2">
          <Link href="/" className="group block">
            <div className="font-schibsted font-bold text-[22px] tracking-[-1.44px] text-black group-hover:opacity-80 transition-opacity">
              Doc<span className="text-gray-400">Sense</span>
            </div>
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] mt-1 block">
              Enterprise Console
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isPaidFeature = item.comingSoon;
            return (
              <Link 
                key={item.label}
                href={item.path}
                onClick={(e) => {
                  if (isPaidFeature) {
                    e.preventDefault();
                    alert(`🚀 The ${item.label} feature is coming soon in the next major update!`);
                  }
                }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-schibsted font-bold text-sm transition-all ${
                  pathname === item.path 
                    ? "bg-black text-white shadow-xl shadow-black/10" 
                    : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
              >
                {isPaidFeature ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-purple-500/10 text-purple-600 font-bold uppercase text-[7.5px] tracking-wider font-schibsted border border-purple-500/15 whitespace-nowrap">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.icon}
                    {item.label}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-black/5 space-y-2">
          <Link 
            href="/dashboard/settings"
            className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-schibsted font-bold text-sm transition-all ${
              pathname === "/dashboard/settings" 
                ? "bg-black text-white shadow-xl shadow-black/10" 
                : "text-black/40 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl font-schibsted font-bold text-sm text-red-500/80 hover:bg-red-500/5 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-black/5 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="w-full bg-[#f8f8f8] border border-black/5 rounded-xl px-4 py-2 flex items-center gap-3">
              <SearchIcon className="w-4 h-4 text-black/20" />
              <input 
                type="text" 
                placeholder="Search documents or queries..." 
                className="bg-transparent outline-none text-sm w-full text-black placeholder:text-black/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="bg-black text-white px-6 py-2.5 rounded-xl font-schibsted font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-black/10">
              <Plus className="w-4 h-4" />
              New Index
            </button>
            <div className="flex items-center gap-3">
              <span className="font-schibsted font-bold text-xs uppercase tracking-widest text-black/60">{username}</span>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-50 border border-black/5 shadow-sm flex items-center justify-center font-bold text-black font-schibsted text-sm uppercase">
                {username.substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto bg-[#fcfcfc]">
          {children}
        </div>
      </main>
    </div>
  );
}
