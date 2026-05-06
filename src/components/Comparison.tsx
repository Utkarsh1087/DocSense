"use client";

import { Check, X, Sparkles } from "lucide-react";

const rows = [
  { feature: "Sub-25ms Latency", docsense: true, others: false },
  { feature: "Page & Source Citations", docsense: true, others: true },
  { feature: "128K Token Context", docsense: true, others: false },
  { feature: "SOC 2 Type II Compliance", docsense: true, others: false },
  { feature: "Custom Vector Sharding", docsense: true, others: false },
  { feature: "OCR for Scanned Docs", docsense: true, others: true },
];

export default function Comparison() {
  return (
    <section className="bg-white py-20 px-[120px] border-b border-black/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/40 mb-4 block">
            Why DocSense?
          </span>
          <h2 className="font-fustat font-bold text-[48px] leading-none tracking-[-2.4px] text-black uppercase">
            The standard for <br /> <span className="text-gray-400">knowledge engineering.</span>
          </h2>
        </div>

        <div className="bg-[#f8f8f8] rounded-[40px] p-8 border border-black/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-4 font-schibsted font-bold text-[10px] uppercase tracking-widest text-black/40">Capability</th>
                <th className="py-4 font-schibsted font-bold text-[10px] uppercase tracking-widest text-black text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-green-600" />
                    DocSense
                  </div>
                </th>
                <th className="py-4 font-schibsted font-bold text-[10px] uppercase tracking-widest text-black/40 text-center">Others</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-black/5 last:border-0 group">
                  <td className="py-4 font-inter font-medium text-black text-sm">{row.feature}</td>
                  <td className="py-4 text-center">
                    <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full text-black">
                      <Check className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    {row.others ? (
                      <Check className="w-4 h-4 text-black/20 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-black/10 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
