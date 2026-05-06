"use client";

import React from "react";
import { 
  FolderOpen, 
  BarChart3, 
  Users, 
  Settings, 
  MessageSquare, 
  Search as SearchIcon,
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: <FolderOpen className="w-5 h-5" />, label: "Library", path: "/dashboard" },
  { icon: <MessageSquare className="w-5 h-5" />, label: "Chat", path: "/dashboard/chat" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics", path: "/dashboard/analytics" },
  { icon: <Users className="w-5 h-5" />, label: "Team", path: "/dashboard/team" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-black/5 flex flex-col p-6">
        <div className="mb-12 px-2">
          <div className="font-schibsted font-bold text-[22px] tracking-[-1.44px] text-black">
            Doc<span className="text-gray-400">Sense</span>
          </div>
          <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] mt-1 block">
            Enterprise Console
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.label}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-schibsted font-bold text-sm transition-all ${
                pathname === item.path 
                  ? "bg-black text-white shadow-xl shadow-black/10" 
                  : "text-black/40 hover:bg-black/5 hover:text-black"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-black/5">
          <button className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl font-schibsted font-bold text-sm text-black/40 hover:bg-black/5 hover:text-black transition-all">
            <Settings className="w-5 h-5" />
            Settings
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-50 border border-black/5 shadow-sm" />
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto bg-[#fcfcfc]">
          {children}
        </div>
      </main>
    </div>
  );
}
