"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GravityStarsBackground from "@/components/GravityStarsBackground";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white py-20 px-6 md:px-12 flex flex-col items-center justify-start">
      <div className="absolute inset-0 z-0">
        <GravityStarsBackground />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl flex flex-col gap-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="font-fustat font-bold text-2xl md:text-3xl tracking-tight">Terms of Service</h1>
            <p className="text-white/40 text-xs font-schibsted uppercase tracking-wider mt-1">Last Updated: August 20, 2026</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl text-xs font-schibsted uppercase tracking-widest transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>

        <div className="prose prose-invert text-white/70 font-inter text-sm md:text-base leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the platform at DocSense, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you are prohibited from using the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">2. SaaS Limits and Subscriptions</h2>
            <p>
              DocSense operates on a multi-tiered subscription model:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Starter Tier (Free):</strong> Restricts user libraries to a maximum of 3 indexed documents, a 32K context token extraction limit, and standard search speed.</li>
              <li><strong>Pro Tier ($12/mo):</strong> Grants unlimited document indexing, priority retrieval latency, 128K context reasoning token window, and advanced citation parameters.</li>
            </ul>
            <p>
              Downgrades to the Starter tier will block document uploads if your active document library exceeds 3 documents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">3. Acceptable Use Policy</h2>
            <p>
              You are responsible for all documents uploaded or links indexed using DocSense. You agree not to upload any material that is illegal, defamatory, violates any third-party intellectual property rights, or violates data privacy laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">4. Service Availability & Warranties</h2>
            <p>
              DocSense is provided "as is" and "as available". While we target 99.9% uptime, we make no warranties regarding uninterrupted availability, data accuracy, or retrieval completeness. Under no circumstances will DocSense be liable for any loss of data or service interruptions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">5. Modification of Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any feature (such as the document limits or subscription tiers) at any time. Any changes to pricing tiers will be communicated via your registered account email.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
