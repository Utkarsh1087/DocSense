"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, MoreVertical, Download, Trash2, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2, Info } from "lucide-react";

interface Document {
  id: string;
  name: string;
  size: string;
  date: string;
  status: string;
  tokens: string;
  chunkCount?: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Indexed": "bg-green-500/10 text-green-600 border-green-500/20",
    "Parsing": "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse",
    "Error": "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const Icon = status === "Indexed" ? CheckCircle2 : status === "Parsing" ? Clock : AlertCircle;

  return (
    <div className={`px-3 py-1 rounded-full border text-[10px] font-bold font-schibsted uppercase tracking-widest flex items-center gap-1.5 ${styles[status] || styles["Error"]}`}>
      <Icon className="w-3 h-3" />
      {status}
    </div>
  );
};

export default function DocumentLibrary() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState("Starter");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [greeting, setGreeting] = useState("Hello!");

  // Import PDF link from public URL
  const importPdfFromUrl = async (url: string, plan: string) => {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/import-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-plan": plan,
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to index link document.");
      }

      setDocuments((prev) => [data, ...prev]);
      alert(`🎉 Successfully downloaded and indexed "${data.name}"!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to import PDF link.");
      alert(`❌ Ingestion failed: ${err.message || "Failed to import PDF link."}`);
    } finally {
      setUploading(false);
    }
  };

  // Fetch documents on load
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents.");
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    let activePlan = localStorage.getItem("userPlan") || "Starter";

    // Check for Stripe checkout success redirection
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("checkout_status") === "success") {
      localStorage.setItem("userPlan", "Pro");
      activePlan = "Pro";
      setUserPlan("Pro");
      // Clean query string from url
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      alert("🎉 Congratulations! Your payment was successful. You have been upgraded to the Pro Tier.");
    } else {
      setUserPlan(activePlan);
    }

    // Check for URL PDF Ingestion
    const importUrl = queryParams.get("import_url");
    const pendingUrl = localStorage.getItem("pending_pdf_url");

    if (importUrl) {
      importPdfFromUrl(importUrl, activePlan);
      // Clean query string from url
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (pendingUrl) {
      importPdfFromUrl(pendingUrl, activePlan);
      localStorage.removeItem("pending_pdf_url");
    }

    const fetchGreeting = async () => {
      const storedName = localStorage.getItem("username") || "User";
      try {
        const res = await fetch(`/api/greetings?username=${encodeURIComponent(storedName)}`);
        if (res.ok) {
          const data = await res.json();
          setGreeting(`Hello, ${data.greetingName}!`);
        } else {
          setGreeting(`Hello, ${storedName.split(" ")[0]}!`);
        }
      } catch (err) {
        setGreeting(`Hello, ${storedName.split(" ")[0]}!`);
      }
    };
    fetchGreeting();
  }, []);

  // Handle PDF Upload & Ingestion
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported currently.");
      return;
    }

    setUploading(true);
    setError(null);

    if (userPlan === "Starter" && documents.length >= 3) {
      alert("You have reached the upload limit of 3 documents on the Starter plan. Please upgrade to Pro in Settings to upload unlimited documents.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "x-user-plan": userPlan,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to index document.");
      }

      // Add to documents list
      setDocuments((prev) => [data, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload and index document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Document Deletion
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? All associated vector embeddings will be permanently removed from Pinecone.")) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete document.");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete document.");
    }
  };

  // Navigate to chat pre-selecting this document
  const handleChatDoc = (docName: string) => {
    router.push(`/dashboard/chat?doc=${encodeURIComponent(docName)}`);
  };

  return (
    <div className="p-10 font-inter">
      {/* Title section */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-2 font-schibsted">
            {greeting}
          </span>
          <h1 className="font-fustat font-bold text-4xl text-black tracking-tight mb-2 uppercase">Library</h1>
          <p className="text-sm font-medium text-black/40 font-inter">Manage and query your indexed documentation.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-4 bg-white border border-black/5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block font-schibsted">Indexed Chunks</span>
              <span className="text-sm font-bold text-black font-schibsted">
                {documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0)} Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex gap-3 text-sm text-red-600 mb-8 max-w-4xl font-inter">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Starter Plan Usage Warning Card */}
      {userPlan === "Starter" && (
        <div className="bg-blue-50 border border-blue-200/50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm text-blue-700 mb-8 max-w-4xl font-inter">
          <div className="flex gap-3">
            <Info className="w-5 h-5 shrink-0 text-blue-600" />
            <div>
              <span className="font-bold">Starter Plan:</span> You have uploaded <span className="font-bold">{documents.length}</span> out of <span className="font-bold">3</span> permitted documents. Upgrade to Pro for unlimited uploads.
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-schibsted font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-black/40">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs font-bold font-schibsted uppercase tracking-widest">Loading knowledge library...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-black/10 rounded-[32px] flex flex-col items-center justify-center gap-4 text-black/40">
            <FileText className="w-10 h-10 text-black/20" />
            <div className="text-center">
              <span className="font-schibsted font-bold text-xs uppercase tracking-widest block mb-1">No Indexed Documents</span>
              <span className="text-xs font-inter">Index your first PDF to begin querying.</span>
            </div>
          </div>
        )}

        {/* Document Cards */}
        {!loading && documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-black/5 rounded-[32px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <button className="text-black/20 hover:text-black transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-fustat font-bold text-lg text-black mb-1 line-clamp-1 group-hover:text-green-600 transition-colors" title={doc.name}>
              {doc.name}
            </h3>
            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest font-schibsted mb-6">
              {doc.size} • {doc.date}
            </p>

            <div className="flex justify-between items-center pt-6 border-t border-black/5">
              <StatusBadge status={doc.status} />
              <div className="text-right">
                <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest block font-schibsted">Tokens</span>
                <span className="text-xs font-bold text-black font-schibsted">{doc.tokens}</span>
              </div>
            </div>

            {/* Quick Actions Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() => handleChatDoc(doc.name)}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-md"
                title="Chat with document"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDeleteDoc(doc.id)}
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-md"
                title="Delete document"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Card (Loader or Button) */}
        {!loading && (
          uploading ? (
            <div className="border-2 border-dashed border-black/10 rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 text-black/40 bg-black/[0.02]">
              <Loader2 className="w-8 h-8 animate-spin text-black/40" />
              <span className="font-schibsted font-bold text-xs uppercase tracking-widest text-center">Parsing & Indexing PDF...</span>
            </div>
          ) : (
            <button
              onClick={handleUploadClick}
              className="border-2 border-dashed border-black/10 rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 text-black/20 hover:text-black hover:border-black/20 transition-all"
            >
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-schibsted font-bold text-xs uppercase tracking-widest">Index New Document</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
