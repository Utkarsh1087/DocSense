"use client";

import React, { useState, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Starter",
    price: "$0",
    desc: "For individuals exploring document intelligence.",
    features: ["3 Documents / month", "32K Token Context", "Standard Latency", "Community Support"],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$12",
    desc: "For engineering teams and heavy researchers.",
    features: ["Unlimited Documents", "128K Token Context", "Ultra-low Latency", "Page & Source Citations", "SOC 2 Type II Security"],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For organizations with custom security & scale needs.",
    features: ["Dedicated Infrastructure", "Custom LLM Fine-tuning", "SSO & Audit Logs", "24/7 Dedicated Support", "On-prem Deployment"],
    cta: "Coming Soon",
    popular: false
  }
];

export default function Pricing() {
  const router = useRouter();
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [session, setSession] = useState({ isLoggedIn: false, plan: "Starter" });

  useEffect(() => {
    setSession({
      isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
      plan: localStorage.getItem("userPlan") || "Starter",
    });
  }, []);

  const handlePricingClick = async (planName: string) => {
    const plan = planName.toLowerCase();

    // 1. Not logged in -> take to signup with selected plan
    if (!session.isLoggedIn) {
      router.push(`/signup?plan=${plan}`);
      return;
    }

    // 2. Logged in and already on Pro -> always take to dashboard
    if (session.plan === "Pro") {
      router.push("/dashboard");
      return;
    }

    // 3. Logged in and on Starter -> route or upgrade
    if (session.plan === "Starter") {
      if (plan === "starter") {
        router.push("/dashboard");
      } else if (plan === "pro") {
        setUpgradingPlan(true);
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planName: "pro" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to initialize Stripe session.");
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (err: any) {
          alert(err.message || "Failed to redirect to billing portal.");
        } finally {
          setUpgradingPlan(false);
        }
      }
    }
  };
  return (
    <section id="pricing" className="bg-white py-32 px-[120px] border-b border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-[10px] font-bold font-schibsted uppercase tracking-[0.3em] text-black/40 mb-6 block">
            Flexible Growth
          </span>
          <h2 className="font-fustat font-bold text-[56px] leading-none tracking-[-2.8px] text-black uppercase mb-8">
            Built for teams <br /> <span className="text-gray-400">of all sizes.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative flex flex-col p-8 rounded-[32px] border ${
                plan.popular ? "bg-black text-white border-black" : "bg-white text-black border-black/5"
              } transition-all hover:shadow-2xl hover:-translate-y-1`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-black font-schibsted font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-12">
                <h3 className="font-schibsted font-bold text-xs uppercase tracking-widest opacity-40 mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-fustat font-bold tracking-tighter">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-sm font-medium opacity-40">/mo</span>}
                </div>
                <p className="text-sm font-medium opacity-60 leading-relaxed font-inter">
                  {plan.desc}
                </p>
              </div>

              <div className="flex-1 mb-12">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-medium font-inter">
                      <Check className={`w-4 h-4 shrink-0 ${plan.popular ? "text-green-500" : "text-black"}`} />
                      <span className="opacity-80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  if (plan.price !== "Custom") {
                    handlePricingClick(plan.name);
                  }
                }}
                disabled={upgradingPlan && plan.name === "Pro"}
                className={`w-full py-4 rounded-2xl font-schibsted font-bold text-xs uppercase tracking-widest transition-all text-center block cursor-pointer disabled:opacity-50 ${
                  plan.popular 
                    ? "bg-white text-black hover:bg-gray-100" 
                    : "bg-black text-white hover:bg-black/80"
                } ${plan.price === "Custom" ? "pointer-events-none opacity-50 cursor-not-allowed" : ""}`}
              >
                {upgradingPlan && plan.name === "Pro" ? "Connecting..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
