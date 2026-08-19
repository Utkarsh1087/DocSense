"use client";

import { Upload, Database, MessageSquare, Link as LinkIcon } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Ingestion",
    desc: "Seamlessly upload complex docs. Supports PDFs, DOCX, and scanned images. Our engine sanitizes and prepares data for parsing.",
    icon: <Upload className="w-6 h-6" />,
  },
  {
    num: "02",
    title: "Indexing",
    desc: "Data is chunked and indexed for meaning, not just keywords, using state-of-the-art embedding models.",
    icon: <Database className="w-6 h-6" />,
  },
  {
    num: "03",
    title: "Inference",
    desc: "Query your data in natural language. DocSense retrieves context and generates precise, human-like answers.",
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    num: "04",
    title: "Citation",
    desc: "Every answer links back to exact page and paragraph so your team can verify sources instantly.",
    icon: <LinkIcon className="w-6 h-6" />,
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="relative bg-white py-32 px-[120px]">
      {/* Fading Top Divider */}
      <div className="absolute top-0 left-0 right-0 h-[32px] pointer-events-none">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="w-full h-full bg-gradient-to-b from-black/[0.05] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/40 mb-6 block">
            How it works
          </span>
          <h2 className="font-fustat font-bold text-[56px] leading-none tracking-[-2.8px] text-black uppercase">
            From upload to answer <br /> <span className="text-gray-400">in 4 steps.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step) => (
            <div key={step.num} className="group relative">
              <div className="text-[100px] font-fustat font-extrabold text-black/[0.03] leading-none absolute -top-10 -left-4 pointer-events-none group-hover:text-black/[0.05] transition-colors">
                {step.num}
              </div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-fustat font-bold text-black mb-4 uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="text-grayText text-sm font-medium leading-relaxed font-inter">
                  {step.desc}
                </p>
              </div>

              {/* Decorative Line */}
              <div className="mt-12 h-px w-full bg-gradient-to-r from-black/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
