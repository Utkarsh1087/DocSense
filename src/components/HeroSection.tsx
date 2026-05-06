"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Mic, Search, Sparkles, Link as LinkIcon } from "lucide-react";
import Toast from "./Toast";

const placeholders = [
  "Paste a PDF link here to start indexing...",
  "e.g. What are the indemnification clauses in this contract?",
  "e.g. Summarize the technical architecture of the vector engine.",
  "e.g. Find all references to GDPR compliance."
];

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);
  const fadingOutRef = useRef(false);
  const requestRef = useRef<number>();
  
  // Typing Animation State
  const [placeholder, setPlaceholder] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [queryInput, setQueryInput] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const performFade = (target: number, duration: number, callback?: () => void) => {
      const startOpacity = opacity;
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = startOpacity + (target - startOpacity) * progress;
        setOpacity(currentOpacity);
        if (progress < 1) requestRef.current = requestAnimationFrame(animate);
        else if (callback) callback();
      };
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };

    const handleTimeUpdate = () => {
      if (!video) return;
      if (video.duration - video.currentTime <= 0.55 && !fadingOutRef.current) {
        fadingOutRef.current = true;
        performFade(0, 250);
      }
    };

    const handleEnded = () => {
      setOpacity(0);
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play();
          fadingOutRef.current = false;
          performFade(1, 250);
        }
      }, 100);
    };

    performFade(1, 250);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Typing Effect Logic
  useEffect(() => {
    const currentFullText = placeholders[placeholderIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setPlaceholder(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        if (charIndex + 1 === currentFullText.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setPlaceholder(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }
      }
    }, isDeleting ? 30 : 60);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  const handleQuery = () => {
    if (!queryInput) return;
    setShowToast(true);
    setQueryInput("");
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center pt-[200px] px-[120px] bg-white overflow-hidden">
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        message="Intelligence Engine: Successfully retrieved context from page 12 of 'Q3_Master_Agreement.pdf'. Answer generated with 99.8% confidence."
      />

      <div className="absolute inset-0 w-[115%] h-[125%] left-[-7.5%] top-[-10%] z-0">
        <video
          ref={videoRef}
          autoPlay muted playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
          className="w-full h-full object-cover object-top opacity-30"
          style={{ opacity: opacity }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center -mt-[50px]">
        <h1 className="font-fustat font-bold text-[clamp(40px,8vw,88px)] leading-[0.95] tracking-[-4.8px] text-black mb-[34px]">
          Ask Anything. <br /> Know Everything.
        </h1>

        <p className="font-fustat font-medium text-[20px] tracking-[-0.4px] text-grayText max-w-[640px] mb-[44px] leading-relaxed">
          Stop ctrl+F-ing through 300-page PDFs. DocSense lets your team ask questions and get precise answers instantly.
        </p>

        <div className="w-full max-w-[728px] h-[220px] bg-black/[0.08] backdrop-blur-2xl rounded-[24px] p-8 flex flex-col justify-between border border-black/5 shadow-2xl">
          <div className="flex justify-between items-center text-black/60 font-schibsted font-bold text-[10px] uppercase tracking-[0.15em]">
            <div className="flex items-center gap-3">
              <span className="bg-green-500 w-1.5 h-1.5 rounded-full animate-pulse" />
              <span>Intelligence Engine: Active</span>
              <button className="text-black underline ml-2">Live Demo</button>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Optimized for GPT-4o</span>
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-3 flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-black/5">
            <input 
              type="text" 
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              placeholder={placeholder}
              className="flex-1 px-4 py-2 outline-none text-[16px] text-black placeholder:text-black/40 font-inter"
            />
            <button 
              onClick={handleQuery}
              className="w-[44px] h-[44px] bg-black rounded-[12px] flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {[
                { icon: <LinkIcon className="w-3.5 h-3.5" />, label: "Paste PDF Link" },
                { icon: <Paperclip className="w-3.5 h-3.5" />, label: "Upload" },
                { icon: <Search className="w-3.5 h-3.5" />, label: "Index" },
              ].map((btn) => (
                <button key={btn.label} className="bg-white/80 hover:bg-white px-4 py-2 rounded-[10px] flex items-center gap-2 text-[11px] text-black font-bold font-schibsted uppercase tracking-wider transition-colors border border-black/5 shadow-sm">
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-black/10" />
                  <circle cx="18" cy="18" r="15" stroke="#10b981" strokeWidth="3.5" fill="transparent" strokeDasharray="94" strokeDashoffset="80" strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-black font-bold font-schibsted leading-none mb-1 uppercase tracking-tighter">0 / 32K Tokens</span>
                <span className="text-[8px] text-black/40 font-bold font-schibsted uppercase tracking-[0.2em]">Context Limit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
