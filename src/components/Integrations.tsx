"use client";

export default function Integrations() {
  const logos = [
    { name: "Google Drive", color: "bg-blue-500" },
    { name: "Notion", color: "bg-black" },
    { name: "Confluence", color: "bg-blue-600" },
    { name: "AWS S3", color: "bg-orange-500" },
    { name: "Slack", color: "bg-purple-500" },
    { name: "GitHub", color: "bg-gray-900" },
  ];

  return (
    <section className="bg-white py-12 px-[120px] border-b border-black/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/30">
            Syncs seamlessly with
          </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-md ${logo.color} opacity-20`} />
              <span className="font-schibsted font-bold text-sm tracking-tight text-black">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
