/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensuring we can use your RAG libraries in Next.js if needed later
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    },
};

export default nextConfig;
