"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Sparkles, 
  Database, 
  RefreshCw, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  FileText, 
  Trash2, 
  Download, 
  Sliders, 
  Info,
  Laptop,
  User
} from "lucide-react";
import Toast from "@/components/Toast";

interface SettingsState {
  model: string;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
  responsePreset: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  similarityThreshold: number;
  retrievalStrategy: string;
  ocrEnabled: boolean;
  parserMode: string;
  ignoredKeywords: string;
  retentionPolicy: string;
  theme: string;
}

const PRESETS: Record<string, string> = {
  balanced: "You are a Document Expert. Answer questions based ONLY on the provided context. If the answer is not in the context, say 'I could not find the answer in the provided document.' Keep answers concise, clear, and educational.",
  creative: "You are an analytical researcher. Break down concepts, compare findings, explain connections, and offer creative, structured summaries of the context. Provide answers in markdown with sections.",
  strict: "You are a factual audit assistant. Extract exact data points. If any part of the answer is not supported by the context, state that it is missing. Do not extrapolate, infer, or speculate under any circumstance."
};

export default function SettingsPage() {
  const [username, setUsername] = useState("Admin");
  const [userPlan, setUserPlan] = useState("Starter");
  const [settings, setSettings] = useState<SettingsState>({
    model: "gemini-1.5-flash",
    systemInstruction: PRESETS.balanced,
    temperature: 0.2,
    maxTokens: 1024,
    responsePreset: "balanced",
    chunkSize: 1500,
    chunkOverlap: 300,
    topK: 5,
    similarityThreshold: 0.4,
    retrievalStrategy: "standard",
    ocrEnabled: false,
    parserMode: "text",
    ignoredKeywords: "Confidential, Draft",
    retentionPolicy: "never",
    theme: "light",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
        setUsername(localStorage.getItem("username") || "Admin");
        setUserPlan(localStorage.getItem("userPlan") || "Starter");
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Could not load configurations from the server.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings.");
      
      localStorage.setItem("username", username);
      localStorage.setItem("userPlan", userPlan);
      window.dispatchEvent(new Event("user-profile-change"));
      window.dispatchEvent(new Event("user-plan-change"));
      setShowToast(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update configuration settings.");
    } finally {
      setSaving(false);
    }
  };

  const [upgradingPlan, setUpgradingPlan] = useState(false);

  const handleUpgradeToPro = async () => {
    setUpgradingPlan(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: "pro" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize Stripe session.");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert(err.message || "Failed to launch billing portal.");
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setSettings(prev => ({
      ...prev,
      responsePreset: preset,
      systemInstruction: PRESETS[preset] || prev.systemInstruction,
      temperature: preset === "strict" ? 0.0 : preset === "creative" ? 0.8 : 0.2
    }));
  };

  const handleDownloadLogs = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `docsense-library-logs-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert("Failed to download logs.");
    }
  };

  const handleReset = () => {
    if (confirm("Reset all settings to project defaults?")) {
      setSettings({
        model: "gemini-1.5-flash",
        systemInstruction: PRESETS.balanced,
        temperature: 0.2,
        maxTokens: 1024,
        responsePreset: "balanced",
        chunkSize: 1500,
        chunkOverlap: 300,
        topK: 5,
        similarityThreshold: 0.4,
        retrievalStrategy: "standard",
        ocrEnabled: false,
        parserMode: "text",
        ignoredKeywords: "Confidential, Draft",
        retentionPolicy: "never",
        theme: "light",
      });
    }
  };

  return (
    <div className="p-10 font-inter">
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        message="System Settings successfully saved. RAG parameters and environment rules updated."
      />

      {/* Header Panel */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="font-fustat font-bold text-4xl text-black tracking-tight mb-2 uppercase">Settings</h1>
          <p className="text-sm font-medium text-black/40 font-inter">Manage AI reasoning limits, parser chunk engines, and system-wide configurations.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-black/40">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-bold font-schibsted uppercase tracking-widest">Loading configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl pb-20">
          
          {/* Account Profile Settings */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Account Profile Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Username / Display Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin"
                  className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl px-4 py-3 text-sm text-black outline-none placeholder:text-black/30 hover:border-black/10 focus:border-black/20 focus:bg-white transition-all font-inter"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value="admin@docsense.io"
                  disabled
                  className="w-full bg-black/[0.02] border border-black/5 rounded-2xl px-4 py-3 text-sm text-black/40 cursor-not-allowed font-inter"
                />
              </div>
            </div>
          </div>

          {/* Subscription & Billing Tier Settings */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Sliders className="w-5 h-5 text-green-600" />
              Subscription & Billing Tier
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block mb-1">
                  Active Subscription Plan
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-fustat font-bold text-black uppercase">
                    {userPlan} Tier
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-schibsted border ${
                    userPlan === "Pro" 
                      ? "bg-green-500/10 text-green-600 border-green-500/20" 
                      : "bg-black/5 text-black/40 border-black/5"
                  }`}>
                    {userPlan === "Pro" ? "Popular" : "Free"}
                  </span>
                </div>
                <p className="text-xs text-black/40 mt-2 font-inter max-w-md leading-relaxed">
                  {userPlan === "Pro" 
                    ? "You have active Pro benefits: Unlimited uploads, 128K context, citations, and high priority execution."
                    : "Starter plan features: Limit of 3 PDF uploads per month, standard latency, and 32K context limits."}
                </p>
              </div>
              <div>
                {userPlan === "Starter" ? (
                  <button
                    type="button"
                    onClick={handleUpgradeToPro}
                    disabled={upgradingPlan}
                    className="bg-black text-white px-8 py-3.5 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-black/10 disabled:opacity-50 whitespace-nowrap"
                  >
                    {upgradingPlan ? "Connecting..." : "Upgrade to Pro ($12/mo)"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUserPlan("Starter")}
                    className="border border-red-500/20 hover:bg-red-500/5 text-red-500 px-8 py-3.5 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest active:scale-98 transition-all whitespace-nowrap"
                  >
                    Downgrade to Starter
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Section 1: AI Model Configuration */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Inference Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Language Model Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Language Model (Gemini)
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3.5 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Balanced)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Complex Logic)</option>
                </select>
              </div>

              {/* Response Presets Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  AI Response Persona
                </label>
                <select
                  value={settings.responsePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3.5 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="balanced">Balanced Summary (Default)</option>
                  <option value="strict">Strict Auditor (Exact Facts Only)</option>
                  <option value="creative">Creative Researcher (Full Concept breakdown)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                    Model Temperature ({settings.temperature})
                  </label>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                    {settings.temperature === 0 ? "Strict" : settings.temperature >= 0.7 ? "Creative" : "Balanced"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Max Tokens Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                    Max Output Length ({settings.maxTokens} tokens)
                  </label>
                  <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                    ~{Math.round(settings.maxTokens * 0.75)} words
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2048"
                  step="50"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            {/* System Instructions Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                Agent System Instructions
              </label>
              <textarea
                value={settings.systemInstruction}
                onChange={(e) => setSettings({ ...settings, systemInstruction: e.target.value })}
                rows={4}
                className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl p-4 text-sm text-black placeholder:text-black/30 outline-none hover:border-black/10 focus:border-black/20 focus:bg-white transition-all font-inter shadow-xs"
                placeholder="Set system directives for the RAG assistant..."
                required
              />
            </div>
          </div>

          {/* Section 2: RAG Parsing & Retrieval */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              RAG Parser & Vector Search Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Chunk Size Slider */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Chunk Size ({settings.chunkSize} characters)
                </label>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={settings.chunkSize}
                  onChange={(e) => setSettings({ ...settings, chunkSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Chunk Overlap Slider */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Chunk Overlap ({settings.chunkOverlap} characters)
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="50"
                  value={settings.chunkOverlap}
                  onChange={(e) => setSettings({ ...settings, chunkOverlap: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top K Matches */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Context Matches Limit (Top K)
                </label>
                <select
                  value={settings.topK}
                  onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
                    <option key={k} value={k}>
                      {k} Context Matches
                    </option>
                  ))}
                </select>
              </div>

              {/* Similarity Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                    Similarity Score Filter (≥ {settings.similarityThreshold})
                  </label>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={settings.similarityThreshold}
                  onChange={(e) => setSettings({ ...settings, similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              {/* Retrieval Strategy Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Retrieval Strategy
                </label>
                <select
                  value={settings.retrievalStrategy}
                  onChange={(e) => setSettings({ ...settings, retrievalStrategy: e.target.value })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="standard">Standard Dense Chunks</option>
                  <option value="page">Page-Level focus</option>
                  <option value="parent">Parent-Document (Adjacent Chunks)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Document Parsing & Ingestion */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              Document Parsing & Ingestion
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Document Parser Mode */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Structure Parsing Engine
                </label>
                <select
                  value={settings.parserMode}
                  onChange={(e) => setSettings({ ...settings, parserMode: e.target.value })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="text">Standard Text Flow</option>
                  <option value="layout">Preserve Layout Structure (Table aware)</option>
                  <option value="table">Table-Grid Extraction Only</option>
                </select>
              </div>

              {/* Ignore Metadata Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Ignore Chunks Containing Keywords
                </label>
                <input
                  type="text"
                  value={settings.ignoredKeywords}
                  onChange={(e) => setSettings({ ...settings, ignoredKeywords: e.target.value })}
                  placeholder="Confidential, Draft, Footer Note"
                  className="w-full bg-[#f8f8f8] border border-black/5 rounded-2xl px-4 py-3 text-sm text-black outline-none placeholder:text-black/30 hover:border-black/10 focus:border-black/20 focus:bg-white transition-all font-inter"
                />
              </div>
            </div>

            {/* OCR Toggle */}
            <div className="flex justify-between items-center py-4 border-t border-black/5 mt-4 opacity-60">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-black block">Enable OCR Parser</label>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold uppercase text-[8px] tracking-wider font-schibsted">
                    Coming Soon
                  </span>
                </div>
                <span className="text-[10px] text-black/40">OCR processes scanned images/non-selectable PDF files dynamically.</span>
              </div>
              <button
                type="button"
                disabled
                className="focus:outline-none cursor-not-allowed text-black/20"
              >
                <ToggleLeft className="w-12 h-8 text-black/20" />
              </button>
            </div>
          </div>

          {/* Section 4: Workspace & Security */}
          <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm">
            <h2 className="font-fustat font-bold text-lg text-black mb-6 uppercase flex items-center gap-2">
              <Laptop className="w-5 h-5 text-gray-600" />
              Workspace Preferences & Retention
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Workspace Theme */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Console Interface Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="light">Clean Light (Recommended)</option>
                  <option value="dark">Sleek Dark Mode</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              {/* Data Retention Policy */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block">
                  Document Cache Expiry
                </label>
                <select
                  value={settings.retentionPolicy}
                  onChange={(e) => setSettings({ ...settings, retentionPolicy: e.target.value })}
                  className="w-full bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-schibsted font-bold text-black outline-none shadow-sm cursor-pointer hover:border-black/20 focus:border-black/20 transition-colors"
                >
                  <option value="never">Never (Keep forever)</option>
                  <option value="7days">After 7 days</option>
                  <option value="30days">After 30 days</option>
                </select>
              </div>

              {/* Download Logs Trigger */}
              <div className="space-y-2 flex flex-col justify-end">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40 block mb-2">
                  System Logging
                </label>
                <button
                  type="button"
                  onClick={handleDownloadLogs}
                  className="w-full bg-white border border-black/10 hover:bg-black/5 text-black font-schibsted font-bold text-xs uppercase tracking-widest px-4 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 outline-none"
                >
                  <Download className="w-4 h-4" />
                  Download Library Logs
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-8 py-4 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {saving ? "Saving Preferences..." : "Save Configuration"}
              {!saving && <Save className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="border border-black/5 bg-white text-black/60 px-8 py-4 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
            >
              Reset Defaults
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
