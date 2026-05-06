"use client";

import { FileText, Cpu, Zap, Search } from "lucide-react";

const features = [
  {
    title: "Vector Embeddings",
    desc: "Every sentence is converted into a 768-dimensional mathematical vector for perfect semantic understanding.",
    icon: <Cpu className="w-6 h-6" />,
  },
  {
    title: "Recursive Chunking",
    desc: "Intelligent text splitting that preserves context while optimizing for the LLM's attention window.",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    title: "Instant Retrieval",
    desc: "Find relevant data across thousands of pages in milliseconds using Pinecone vector search.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    title: "Gemini Synthesis",
    desc: "Powered by Gemini 2.0 to provide clear, citation-backed answers based strictly on your document.",
    icon: <Zap className="w-6 h-6" />,
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-hero-bg py-32 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            ENGINEERED FOR <span className="text-primary italic">PRECISION</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            DocSense isn't just a chatbot. It's a professional-grade RAG pipeline designed to handle complex technical documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-hero-bg p-10 hover:bg-white/[0.02] transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-4 uppercase tracking-wider">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
