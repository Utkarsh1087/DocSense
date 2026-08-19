"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GravityStarsBackground from "@/components/GravityStarsBackground";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white py-20 px-6 md:px-12 flex flex-col items-center justify-start">
      <div className="absolute inset-0 z-0">
        <GravityStarsBackground />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl flex flex-col gap-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="font-fustat font-bold text-2xl md:text-3xl tracking-tight">Privacy Policy</h1>
            <p className="text-white/40 text-xs font-schibsted uppercase tracking-wider mt-1">Last Updated: August 20, 2026</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl text-xs font-schibsted uppercase tracking-widest transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>

        <div className="prose prose-invert text-white/70 font-inter text-sm md:text-base leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when creating an account, uploading document files, or communicating with us. This includes your username, email address, password hash, and the metadata of documents you process through DocSense.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">2. Document Storage & Vector Ingestion</h2>
            <p>
              When you upload files or paste document URLs, they are parsed and stored securely. Text fragments are converted into vector embeddings and index mapping points within Pinecone. We do not inspect your document content for training models, nor do we sell, rent, or lease any of your document text blocks to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">3. Payment & Subscription Processing</h2>
            <p>
              We utilize Stripe as a third-party processor for handling paid Pro subscriptions. Your full card details, credit details, and card numbers are processed directly on Stripe's secure sandbox and are never stored on DocSense databases.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">4. Data Deletion Policies</h2>
            <p>
              You can delete any document index inside the DocSense dashboard at any time. Clicking "Delete" permanently purges the raw document registry file and deletes the associated vector mapping indexes from our Pinecone cluster.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-fustat font-bold text-lg">5. Contact Information</h2>
            <p>
              For privacy concerns, data deletion inquiries, or other security feedback, contact our privacy compliance team at <span className="text-blue-400">security@docsense.io</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
