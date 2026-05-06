"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Head of Engineering @ CloudScale",
    quote: "DocSense cut our engineering onboarding time by 40%. New hires just ask the docs instead of pestering senior devs.",
    image: "https://i.pravatar.cc/150?u=alex"
  },
  {
    name: "Sarah Chen",
    role: "Technical Lead @ FinTech Solutions",
    quote: "The citation accuracy is what won us over. Knowing exactly which page and paragraph an answer came from is a game changer for compliance.",
    image: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    name: "Marcus Thorne",
    role: "CTO @ Nexus Systems",
    quote: "We've indexed over 50,000 pages of legacy technical debt. DocSense is the first tool that actually made that data useful.",
    image: "https://i.pravatar.cc/150?u=marcus"
  }
];

export default function Testimonials() {
  return (
    <section className="bg-[#f8f8f8] py-32 px-[120px]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/40 mb-6 block">
            Trusted by the best
          </span>
          <h2 className="font-fustat font-bold text-[56px] leading-none tracking-[-2.8px] text-black uppercase mb-8">
            Powering technical <br /> <span className="text-gray-400">knowledge at scale.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white p-10 rounded-[32px] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex gap-1 mb-8">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-black text-black" />
                ))}
              </div>
              
              <p className="font-inter font-medium text-lg text-black leading-relaxed mb-10 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                <div>
                  <h4 className="font-fustat font-bold text-black uppercase tracking-tight">{t.name}</h4>
                  <p className="font-schibsted font-bold text-[10px] uppercase tracking-widest text-black/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
