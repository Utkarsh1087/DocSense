import type { Metadata } from "next";
import { Inter, Schibsted_Grotesk, Noto_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const noto = Noto_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto" });

export const metadata: Metadata = {
  title: "DocSense | AI Knowledge Management",
  description: "Intelligent document RAG for modern engineering teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html.lenis {
            height: auto;
          }
          .lenis-smooth {
            scroll-behavior: auto !important;
          }
          .lenis-smooth [data-lenis-prevent] {
            overscroll-behavior: contain;
          }
          .lenis-stopped {
            overflow: hidden;
          }
        `}</style>
      </head>
      <body className={`${inter.variable} ${schibsted.variable} ${noto.variable} antialiased`}>
        {children}
        <Script id="lenis-init" strategy="afterInteractive">
          {`
            (function() {
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
              script.onload = () => {
                const lenis = new Lenis({
                  duration: 1.2,
                  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                  direction: 'vertical',
                  gestureDirection: 'vertical',
                  smooth: true,
                  mouseMultiplier: 1,
                  smoothTouch: false,
                  touchMultiplier: 2,
                  infinite: false,
                });

                function raf(time) {
                  lenis.raf(time);
                  requestAnimationFrame(raf);
                }

                requestAnimationFrame(raf);
              };
              document.head.appendChild(script);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
