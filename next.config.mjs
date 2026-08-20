/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent pdf-parse and related native modules from being bundled (Next.js 14)
    serverComponentsExternalPackages: ["pdf-parse", "canvas"],
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  webpack: (config, { isServer }) => {
    // Node.js fs/path modules — not available in browser bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },

  // Security & performance headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/chat",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
};

export default nextConfig;
