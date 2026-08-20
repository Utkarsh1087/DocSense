"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Send, Sparkles, Loader2, BookOpen, AlertCircle, FileText, Zap, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Citation {
  id: string;
  score: number;
  filename: string;
  pageNumber: number | string;
}

interface Message {
  role: "user" | "model";
  text: string;
  citations?: Citation[];
  vectorMs?: number;
  totalMs?: number;
  streaming?: boolean;
}

interface Document {
  id: string;
  name: string;
}

// ── SSE stream consumer ────────────────────────────────────────────────────────

async function streamChat(
  payload: { message: string; history: any[]; documentName?: string },
  headers: Record<string, string>,
  onToken: (token: string) => void,
  onMeta: (meta: { vectorMs?: number; model?: string }) => void,
  onDone: (data: { citations: Citation[]; totalMs: number; vectorMs: number }) => void,
  onError: (msg: string) => void
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    onError(data.error || `Request failed (${res.status})`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response body available.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));

        if (event.error) {
          onError(event.error);
          return;
        }
        if (event.vectorMs !== undefined && !event.done) {
          onMeta({ vectorMs: event.vectorMs, model: event.model });
        }
        if (event.token) {
          onToken(event.token);
        }
        if (event.done && event.citations !== undefined) {
          onDone({
            citations: event.citations,
            totalMs: event.totalMs || 0,
            vectorMs: event.vectorMs || 0,
          });
        }
      } catch {
        // Malformed SSE event — skip
      }
    }
  }
}

// ── Latency badge ──────────────────────────────────────────────────────────────

function LatencyBadge({ vectorMs, totalMs }: { vectorMs?: number; totalMs?: number }) {
  if (!vectorMs && !totalMs) return null;
  return (
    <div className="flex items-center gap-3 mt-2 pl-2">
      {vectorMs !== undefined && (
        <span className="flex items-center gap-1 text-[9px] font-bold font-schibsted uppercase tracking-widest text-black/30 bg-green-50 border border-green-100 rounded-md px-2 py-0.5">
          <Zap className="w-2.5 h-2.5 text-green-500" />
          {vectorMs}ms retrieval
        </span>
      )}
      {totalMs !== undefined && (
        <span className="flex items-center gap-1 text-[9px] font-bold font-schibsted uppercase tracking-widest text-black/30 bg-purple-50 border border-purple-100 rounded-md px-2 py-0.5">
          <Clock className="w-2.5 h-2.5 text-purple-500" />
          {totalMs}ms total
        </span>
      )}
    </div>
  );
}

// ── Main chat component ────────────────────────────────────────────────────────

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
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch("/api/documents", {
          headers: { "x-user-id": localStorage.getItem("userId") || "" },
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
    abortRef.current = false;

    // Append user message
    const updatedMessages = [...messages, { role: "user" as const, text: userMessageText }];
    setMessages(updatedMessages);

    // Add a streaming placeholder for the model response
    const streamingIdx = updatedMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "model", text: "", streaming: true },
    ]);

    const historyPayload = updatedMessages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const headers: Record<string, string> = {
      "x-user-plan": localStorage.getItem("userPlan") || "Starter",
      "x-user-id": localStorage.getItem("userId") || "",
    };

    const token = localStorage.getItem("docsense_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let finalCitations: Citation[] = [];
    let finalVectorMs: number | undefined;
    let finalTotalMs: number | undefined;

    try {
      await streamChat(
        {
          message: userMessageText,
          history: historyPayload,
          documentName: selectedDoc || undefined,
        },
        headers,
        // onToken
        (token) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const updated = [...prev];
            const msgIdx = streamingIdx;
            if (updated[msgIdx]) {
              updated[msgIdx] = {
                ...updated[msgIdx],
                text: updated[msgIdx].text + token,
              };
            }
            return updated;
          });
        },
        // onMeta
        (meta) => {
          if (meta.vectorMs !== undefined) finalVectorMs = meta.vectorMs;
        },
        // onDone
        (data) => {
          finalCitations = data.citations;
          finalVectorMs = data.vectorMs;
          finalTotalMs = data.totalMs;
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[streamingIdx]) {
              updated[streamingIdx] = {
                ...updated[streamingIdx],
                streaming: false,
                citations: data.citations,
                vectorMs: data.vectorMs,
                totalMs: data.totalMs,
              };
            }
            return updated;
          });
        },
        // onError
        (errMsg) => {
          setError(errMsg);
          setMessages((prev) => prev.filter((_, i) => i !== streamingIdx));
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setMessages((prev) => prev.filter((_, i) => i !== streamingIdx));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#fcfcfc]">
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-10 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-fustat font-bold text-2xl text-black tracking-tight uppercase">Chat Console</h1>
          <p className="text-[11px] font-medium text-black/40 font-inter">
            Query your library with context-aware semantic search.
          </p>
        </div>

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

      {/* Messages */}
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
                msg.role === "user"
                  ? "bg-black text-white"
                  : "bg-white border border-black/5 text-black"
              }`}
            >
              {msg.role === "user" ? (
                <span className="text-xs font-bold font-schibsted">ME</span>
              ) : msg.streaming ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-600" />
              )}
            </div>

            {/* Bubble */}
            <div className="space-y-2 max-w-[85%]">
              <div
                className={`p-5 rounded-[24px] text-sm leading-relaxed shadow-sm font-inter ${
                  msg.role === "user"
                    ? "bg-black text-white rounded-tr-none"
                    : "bg-white border border-black/5 text-black rounded-tl-none"
                }`}
              >
                {msg.text ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : msg.streaming ? (
                  <span className="flex items-center gap-2 text-black/40">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                  </span>
                ) : null}
              </div>

              {/* Citations */}
              {msg.role === "model" && !msg.streaming && msg.citations && msg.citations.length > 0 && (

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
                        title={`Similarity: ${(cit.score * 100).toFixed(1)}%`}
                      >
                        <FileText className="w-3.5 h-3.5 text-black/40" />
                        <span className="font-bold text-black line-clamp-1 max-w-[150px]">{cit.filename}</span>
                        <span className="bg-black/5 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          Page {cit.pageNumber}
                        </span>
                        <span className="bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          {(cit.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

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

      {/* Input */}
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatConsole() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center font-schibsted font-bold text-black/40">
          Loading Chat Console...
        </div>
      }
    >
      <ChatConsoleContent />
    </Suspense>
  );
}
