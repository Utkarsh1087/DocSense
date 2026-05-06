"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white pt-32 pb-16 px-[120px] border-t border-black/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-16 mb-24">
        {/* Logo & Tagline */}
        <div className="col-span-1 md:col-span-2">
          <div className="font-schibsted font-bold text-[24px] tracking-[-1.44px] text-black mb-6">
            Doc<span className="text-gray-400">Sense</span>
          </div>
          <p className="text-black text-sm font-bold font-schibsted uppercase tracking-widest mb-2">
            Turn your documents into answers.
          </p>
          <p className="text-black/30 text-[10px] font-bold font-schibsted uppercase tracking-[0.3em]">
            SOC 2 · GDPR · 99.9% Uptime
          </p>
        </div>
        
        {/* Platform Column */}
        <div className="col-span-1">
          <h4 className="font-schibsted font-bold text-xs uppercase tracking-widest text-black mb-8 opacity-40">Platform</h4>
          <ul className="space-y-4 text-[11px] font-bold font-schibsted text-black/60 uppercase tracking-widest">
            <li><a href="#" className="hover:text-black transition-colors">Features</a></li>
            <li><a href="#pricing" className="hover:text-black transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Changelog</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Status</a></li>
          </ul>
        </div>

        {/* Company Column */}
        <div className="col-span-1">
          <h4 className="font-schibsted font-bold text-xs uppercase tracking-widest text-black mb-8 opacity-40">Company</h4>
          <ul className="space-y-4 text-[11px] font-bold font-schibsted text-black/60 uppercase tracking-widest">
            <li><a href="#" className="hover:text-black transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Security</a></li>
            <li><a href="#" className="hover:text-black transition-colors">About</a></li>
            <li className="pt-2 flex gap-3 text-[9px] opacity-40">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-black/5 flex justify-between items-center text-[10px] text-black/30 font-bold font-schibsted uppercase tracking-[0.3em]">
        <div>© 2026 DocSense · Built for teams who move fast</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-black transition-colors">Twitter</a>
          <a href="#" className="hover:text-black transition-colors">Github</a>
          <a href="#" className="hover:text-black transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  );
}
