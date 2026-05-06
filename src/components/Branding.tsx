"use client";

import React, { useState, useEffect, useRef } from "react";

const Counter = ({ value }: { value: string }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Extract number and suffix (e.g., "1.2" and "M+")
  const match = value.match(/([\d.]+)(.*)/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasStarted(true);
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let start = 0;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo for a smooth finish
      const easeProgress = 1 - Math.pow(2, -10 * progress);
      const currentCount = easeProgress * target;
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, target]);

  return (
    <span ref={elementRef} className="tabular-nums">
      {target % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
};

const stats = [
  { label: "Documents Indexed", value: "1.2M+" },
  { label: "Query Latency", value: "24ms" },
  { label: "RAG Accuracy", value: "99.8%" },
  { label: "Vector Density", value: "1536d" },
];

export default function Branding() {
  return (
    <section className="bg-white py-24 px-[120px] border-y border-black/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="max-w-xs text-center md:text-left">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/40 mb-4 block">
            By The Numbers
          </span>
          <h3 className="text-2xl font-fustat font-bold tracking-tight text-black leading-tight">
            Built for teams that can't afford slow answers.
          </h3>
        </div>

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-12 w-full">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center md:items-start">
              <span className="text-4xl font-fustat font-bold text-black tracking-tighter mb-1">
                {stat.label === "Query Latency" ? "< " : ""}
                <Counter value={stat.value} />
              </span>
              <span className="text-[10px] font-bold font-schibsted uppercase tracking-widest text-black/40">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
