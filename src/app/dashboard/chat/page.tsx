"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Send, Sparkles, MessageSquare, Loader2, BookOpen, AlertCircle, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Message {
  role: "user" | "model";
  text: string;
  citations?: Array<{
    id: string;
    score: number;
    filename: string;
    pageNumber: number | string;
  }>;
}

interface Document {
  id: string;
  name: string;
}

function ChatConsoleContent() {
  const searchParams = useSearchParams();
  const docParam = searchParams.get("doc") || "";
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your DocSense Intelligence Agent. Ask me anything about your indexed documents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>(docParam);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available documents on load
  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch("/api/documents", {
          headers: {
            "x-user-id": localStorage.getItem("userId") || "",
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (err) {
        console.error("Failed to load documents", err);
      }
    }
    fetchDocs();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    // Append user message
    const updatedMessages = [...messages, { role: "user" as const, text: userMessageText }];
    setMessages(updatedMessages);

    try {
      // Map messages for Gemini history format
      const historyPayload = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-plan": localStorage.getItem("userPlan") || "Starter",
          "x-user-id": localStorage.getItem("userId") || ""
        },
        body: JSON.stringify({
          message: userMessageText,
          history: historyPayload,
          documentName: selectedDoc || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate answer.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.answer,
          citations: data.citations,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#fcfcfc]">
      {/* Header Panel */}
      <div className="bg-white border-b border-black/5 px-10 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-fustat font-bold text-2xl text-black tracking-tight uppercase">Chat Console</h1>
          <p className="text-[11px] font-medium text-black/40 font-inter">
            Query your library with context-aware semantic search.
          </p>
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40">
            Query Scope:
          </label>
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="bg-white border border-black/5 rounded-xl px-4 py-2 text-xs font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 transition-colors"
          >
            <option value="">All Documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.name}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Frame */}
      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-4 max-w-4xl ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === "user" ? "bg-black text-white" : "bg-white border border-black/5 text-black"
              }`}
            >
              {msg.role === "user" ? (
                <span className="text-xs font-bold font-schibsted">ME</span>
              ) : (
                <Sparkles className="w-5 h-5 text-purple-600" />
              )}
            </div>

            {/* Chat Bubble */}
            <div className="space-y-3">
              <div
                className={`p-5 rounded-[24px] text-sm leading-relaxed shadow-sm font-inter ${
                  msg.role === "user"
                    ? "bg-black text-white rounded-tr-none"
                    : "bg-white border border-black/5 text-black rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Citations / Sources */}
              {msg.role === "model" && msg.citations && msg.citations.length > 0 && (
                <div className="pl-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold font-schibsted uppercase tracking-widest text-black/40">
                    <BookOpen className="w-3 h-3" />
                    <span>References & Sources ({msg.citations.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-black/5 rounded-lg p-2.5 flex items-center gap-2 text-[10px] font-medium text-black/60 shadow-xs hover:border-black/10 transition-colors"
                        title={`Similarity Match: ${(cit.score * 100).toFixed(1)}%`}
                      >
                        <FileText className="w-3.5 h-3.5 text-black/40" />
                        <span className="font-bold text-black line-clamp-1 max-w-[150px]">{cit.filename}</span>
                        <span className="bg-black/5 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          Page {cit.pageNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-4 max-w-4xl mr-auto">
            <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            </div>
            <div className="bg-white border border-black/5 text-black p-5 rounded-[24px] rounded-tl-none text-sm shadow-sm flex items-center gap-2">
              <span className="font-medium text-black/40 animate-pulse font-inter">Agent is searching index and generating answer...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex gap-3 text-sm text-red-600 max-w-4xl mx-auto font-inter">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Query Error:</span> {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Frame */}
      <div className="bg-white border-t border-black/5 p-6 shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedDoc
                ? `Ask anything about "${selectedDoc}"...`
                : "Ask a question about your indexed knowledge library..."
            }
            className="flex-1 bg-[#f8f8f8] border border-black/5 rounded-2xl px-6 py-4 text-sm text-black placeholder:text-black/30 outline-none hover:border-black/10 focus:border-black/20 focus:bg-white transition-all font-inter shadow-xs"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-black text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10 disabled:opacity-50 disabled:scale-100"
            disabled={!input.trim() || loading}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatConsole() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-schibsted font-bold text-black/40">Loading Chat Console...</div>}>
      <ChatConsoleContent />
    </Suspense>
  );
}
