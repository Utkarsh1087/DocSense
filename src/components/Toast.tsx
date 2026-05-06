"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, X, Sparkles } from "lucide-react";

export default function Toast({ 
  show, 
  onClose, 
  message 
}: { 
  show: boolean; 
  onClose: () => void; 
  message: string 
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); // Wait for fade out
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${
      visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
    }`}>
      <div className="bg-white/80 backdrop-blur-2xl border border-black/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-start gap-4 min-w-[320px] max-w-[400px]">
        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-green-600" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-schibsted font-bold text-xs uppercase tracking-widest text-black/40 mb-1">
            Engine Response
          </h4>
          <p className="text-black text-sm font-medium font-inter leading-relaxed">
            {message}
          </p>
        </div>

        <button 
          onClick={() => setVisible(false)}
          className="text-black/20 hover:text-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-green-500/20 rounded-b-2xl overflow-hidden w-full">
          <div className="h-full bg-green-500 animate-[progress_4s_linear]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
