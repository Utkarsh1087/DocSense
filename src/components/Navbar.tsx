"use client";

import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
      <div className="bg-white/70 backdrop-blur-2xl border border-black/5 rounded-full px-10 py-3.5 flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-w-max">
        {/* Brand */}
        <Link href="/" className="font-schibsted font-bold text-[20px] tracking-[-1.2px] text-black whitespace-nowrap">
          Doc<span className="text-gray-400">Sense</span>
        </Link>

        {/* Navigation - Understand Phase */}
        <div className="flex items-center gap-8">
          <Link href="#" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            Product
          </Link>
          <Link href="#" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            How It Works
          </Link>
        </div>

        {/* Navigation - Evaluate Phase */}
        <div className="flex items-center gap-8 border-l border-black/5 pl-8">
          <Link href="#pricing" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            Pricing
          </Link>
          <Link href="#" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            Docs
          </Link>
          <Link href="#" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            Blog
          </Link>
        </div>

        {/* Action Phase */}
        <div className="flex items-center gap-6 border-l border-black/5 pl-8">
          <Link href="/login" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
            Login
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-black text-white px-8 py-2.5 rounded-full font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg shadow-black/10 whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
