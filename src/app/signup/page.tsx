"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GravityStarsBackground from "@/components/GravityStarsBackground";
import { ArrowRight, Lock, Mail, User, Sparkles } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams?.get("plan") || "Starter";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    // Simulate signup, login, and redirect
    setTimeout(async () => {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", name);
      
      const chosenPlan = planParam.toLowerCase() === "pro" ? "Pro" : "Starter";
      localStorage.setItem("userPlan", "Starter"); // Set default Starter until payment completes

      window.dispatchEvent(new Event("login-state-change"));
      window.dispatchEvent(new Event("user-profile-change"));

      if (chosenPlan === "Pro") {
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planName: "pro" }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (err) {
          console.error("Signup Stripe redirect failed:", err);
        }
      }

      setLoading(false);
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
        starColor="#3b82f6" // Custom blue stars for a premium dark neon aesthetic
      />

      {/* Decorative radial gradients */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none top-[-10%] left-[-10%]" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none bottom-[-10%] right-[-10%]" />

      {/* Signup Card Container */}
      <div className="relative z-10 w-full max-w-[480px] px-6 py-12">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl flex flex-col items-center">
          
          {/* Logo & Header */}
          <div className="mb-6 text-center">
            <Link href="/" className="font-schibsted font-bold text-[28px] tracking-[-1.5px] text-white">
              Doc<span className="text-blue-400">Sense</span>
            </Link>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.25em] mt-1.5 block">
              Knowledge Intelligence Suite
            </span>
          </div>

          <h2 className="text-xl font-fustat font-bold text-white tracking-tight mb-6 text-center flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Create Your Account
          </h2>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-white/50 block">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4.5 h-4.5 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-blue-400/50 focus:bg-white/[0.06] transition-all font-inter"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
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
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-blue-400/50 focus:bg-white/[0.06] transition-all font-inter"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-white/50 block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4.5 h-4.5 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-blue-400/50 focus:bg-white/[0.06] transition-all font-inter"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-white/50 block">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4.5 h-4.5 text-white/30" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none hover:border-white/20 focus:border-blue-400/50 focus:bg-white/[0.06] transition-all font-inter"
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
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-xs font-medium text-white/40 font-inter">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen w-full bg-black flex items-center justify-center overflow-hidden text-white/40 font-schibsted font-bold text-xs uppercase tracking-widest">
        Loading Signup Console...
      </main>
    }>
      <SignupForm />
    </Suspense>
  );
}
