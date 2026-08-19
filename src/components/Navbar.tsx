"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginState = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    checkLoginState();

    window.addEventListener("login-state-change", checkLoginState);
    window.addEventListener("storage", checkLoginState);
    return () => {
      window.removeEventListener("login-state-change", checkLoginState);
      window.removeEventListener("storage", checkLoginState);
    };
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-fit">
      <div className="bg-white/70 backdrop-blur-2xl border border-black/5 rounded-full px-10 py-3.5 flex items-center gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] min-w-max">
        {/* Brand */}
        <Link href="/" className="font-schibsted font-bold text-[20px] tracking-[-1.2px] text-black whitespace-nowrap">
          Doc<span className="text-gray-400">Sense</span>
        </Link>

        {/* Navigation - Understand Phase */}
        <div className="flex items-center gap-8">
          <Link 
            href="/#product" 
            onClick={(e) => handleScroll(e, "product")}
            className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap"
          >
            Product
          </Link>
          <Link 
            href="/#workflow" 
            onClick={(e) => handleScroll(e, "workflow")}
            className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap"
          >
            How It Works
          </Link>
          <Link 
            href="/#pricing" 
            onClick={(e) => handleScroll(e, "pricing")}
            className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap"
          >
            Pricing
          </Link>
        </div>

        {/* Action Phase */}
        <div className="flex items-center gap-6 border-l border-black/5 pl-8">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="bg-black text-white px-8 py-2.5 rounded-full font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg shadow-black/10 whitespace-nowrap"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors whitespace-nowrap">
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-black text-white px-8 py-2.5 rounded-full font-schibsted font-bold text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg shadow-black/10 whitespace-nowrap"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
