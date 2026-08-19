"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import GravityStarsBackground from "./GravityStarsBackground";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CTA() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, []);

  const handleStartTrial = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/signup?plan=starter");
    }
  };

  const handleExplorePlans = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative bg-[#070b0a] py-32 px-[120px] overflow-hidden group">
      {/* 1. Gravity Stars Animation (Silver) */}
      <GravityStarsBackground 
        starsCount={200}
        starsSize={3}
        starsOpacity={0.8}
        glowIntensity={35}
        movementSpeed={0.7}
        mouseInfluence={350}
        mouseGravity="attract"
        gravityStrength={180}
        starColor="#ffffff"
        className="z-0"
      />

      {/* 2. Silver Radial Glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="font-fustat font-bold text-[clamp(40px,8vw,64px)] leading-[1.05] tracking-[-3.2px] text-white mb-8 uppercase text-balance">
          Your docs have answers. <br /> <span className="text-gray-500">Start finding them.</span>
        </h2>
        
        <p className="font-fustat font-medium text-lg text-white/60 mb-12 max-w-xl mx-auto leading-relaxed">
          Join 1,200+ teams who stopped searching and started knowing.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button 
            onClick={handleStartTrial}
            className="bg-white text-black px-10 py-5 rounded-full font-schibsted font-bold text-sm uppercase tracking-widest hover:scale-105 hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all flex items-center gap-3 cursor-pointer"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExplorePlans}
            className="border border-white/30 bg-transparent text-white px-10 py-5 rounded-full font-schibsted font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
          >
            Explore Plans
          </button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelector('section').addEventListener('mousemove', (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty('--mouse-x', x + '%');
          e.currentTarget.style.setProperty('--mouse-y', y + '%');
        });
      `}} />
    </section>
  );
}
