"use client";

import React from "react";
import { FileText, MoreVertical, Eye, Download, Trash2, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const documents = [
  { id: 1, name: "Q3_Master_Agreement.pdf", size: "2.4 MB", date: "2 hours ago", status: "Indexed", tokens: "12,450" },
  { id: 2, name: "Technical_Arch_V4.docx", size: "1.1 MB", date: "5 hours ago", status: "Indexed", tokens: "8,920" },
  { id: 3, name: "Security_Audit_2026.pdf", size: "8.9 MB", date: "1 day ago", status: "Parsing", tokens: "Pending" },
  { id: 4, name: "Employee_Handbook_Draft.pdf", size: "12.2 MB", date: "2 days ago", status: "Error", tokens: "0" },
  { id: 5, name: "API_Documentation_Full.pdf", size: "45.1 MB", date: "3 days ago", status: "Indexed", tokens: "156,000" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Indexed": "bg-green-500/10 text-green-600 border-green-500/20",
    "Parsing": "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse",
    "Error": "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const Icon = status === "Indexed" ? CheckCircle2 : status === "Parsing" ? Clock : AlertCircle;

  return (
    <div className={`px-3 py-1 rounded-full border text-[10px] font-bold font-schibsted uppercase tracking-widest flex items-center gap-1.5 ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {status}
    </div>
  );
};

export default function DocumentLibrary() {
  return (
    <div className="p-10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="font-fustat font-bold text-4xl text-black tracking-tight mb-2 uppercase">Library</h1>
          <p className="text-sm font-medium text-black/40 font-inter">Manage and query your indexed documentation.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-4 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Storage</span>
              <span className="text-sm font-bold text-black">1.2 GB / 10 GB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-black/5 rounded-[32px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all group relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <button className="text-black/20 hover:text-black transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-fustat font-bold text-lg text-black mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
              {doc.name}
            </h3>
            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest font-schibsted mb-6">
              {doc.size} • {doc.date}
            </p>

            <div className="flex justify-between items-center pt-6 border-t border-black/5">
              <StatusBadge status={doc.status} />
              <div className="text-right">
                <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest block">Tokens</span>
                <span className="text-xs font-bold text-black">{doc.tokens}</span>
              </div>
            </div>

            {/* Quick Actions Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
              <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-all">
                <MessageSquare className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-all">
                <Download className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <button className="border-2 border-dashed border-black/10 rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 text-black/20 hover:text-black hover:border-black/20 transition-all">
          <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-schibsted font-bold text-xs uppercase tracking-widest">Index New Document</span>
        </button>
      </div>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
);
