"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GravityStarsBackground from "@/components/GravityStarsBackground";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    // Simulate login and redirect
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isLoggedIn", "true");
      if (!localStorage.getItem("username")) {
        localStorage.setItem("username", "Admin User");
      }
      window.dispatchEvent(new Event("login-state-change"));
      window.dispatchEvent(new Event("user-profile-change"));
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      {/* Background Interactive Star Animation */}
      <GravityStarsBackground
        starsCount={120}
        starsSize={1.5}
        starsOpacity={0.4}
        glowIntensity={15}
        movementSpeed={0.25}
        starColor="#a855f7" // Purple stars for a premium dark neon aesthetic
      />

      {/* Decorative radial gradients */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none top-[-10%] left-[-10%]" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none bottom-[-10%] right-[-10%]" />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[480px] px-6">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl flex flex-col items-center">
          
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <Link href="/" className="font-schibsted font-bold text-[28px] tracking-[-1.5px] text-white">
              Doc<span className="text-purple-400">Sense</span>
            </Link>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.25em] mt-1.5 block">
              Knowledge Intelligence Suite
            </span>
          </div>

          <h2 className="text-xl font-fustat font-bold text-white tracking-tight mb-8 text-center flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Sign in to Console
          </h2>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-white/50 block">
                Work Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4.5 h-4.5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-purple-400/50 focus:bg-white/[0.06] transition-all font-inter"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-white/50 block">
                  Password
                </label>
                <Link href="#" className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4.5 h-4.5 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-purple-400/50 focus:bg-white/[0.06] transition-all font-inter"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/5 disabled:opacity-50 disabled:scale-100 mt-4"
            >
              {loading ? "Authenticating..." : "Access Console"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-xs font-medium text-white/40 font-inter">
            Don't have an account?{" "}
            <Link href="/signup" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
              Register here
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
