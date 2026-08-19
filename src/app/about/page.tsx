"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GravityStarsBackground from "@/components/GravityStarsBackground";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white py-20 px-6 md:px-12 flex flex-col items-center justify-start">
      <div className="absolute inset-0 z-0">
        <GravityStarsBackground />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl flex flex-col gap-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="font-fustat font-bold text-2xl md:text-3xl tracking-tight">About DocSense</h1>
            <p className="text-white/40 text-xs font-schibsted uppercase tracking-wider mt-1">Our Mission & Technology</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl text-xs font-schibsted uppercase tracking-widest transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>

        <div className="prose prose-invert text-white/70 font-inter text-sm md:text-base leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">1. Our Mission</h2>
            <p>
              DocSense was built to solve a simple yet incredibly frustrating problem: **Ctrl+F is not enough**. When dealing with 300-page PDF technical manuals, financial agreements, or regulatory policies, you don't just want keywords; you want semantic understanding and direct answers.
            </p>
            <p>
              Our mission is to democratize document retrieval for modern development, product, and legal teams, turning static paper sheets into a dynamic conversations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">2. Semantic Vector Intelligence</h2>
            <p>
              By leveraging **LangChain character splitters**, Google's **Gemini AI**, and **Pinecone vector databases**, DocSense parses raw file bytes, segments sentences preserving overlap context, indexes them into multidimensional embeddings space, and retrieves the top context slices in milliseconds. This enables our LLM agent to output brevity-optimized, citation-backed solutions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">3. Privacy-First SaaS Platform</h2>
            <p>
              Security and trust are at our core. We offer fully functional multi-tier subscription models verified by **Stripe test checkouts**. Your uploaded documents remain in your dedicated secure storage index, and can be wiped permanently with a single click.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">4. The Team</h2>
            <p>
              DocSense was designed and crafted by developers, for developers, product managers, researchers, and anyone else who would rather query a database than manually scan pages.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
