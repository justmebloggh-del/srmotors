import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Uploaded media are immutable (unique filename per upload), so cache optimised variants for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // The local Supabase stack serves from 127.0.0.1, which Next 16 blocks by
    // default (SSRF protection). Off in real deployments; ALLOW_LOCAL_IMAGES=true
    // only for testing a production build against the local stack.
    dangerouslyAllowLocalIP:
      process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_IMAGES === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Local Supabase stack (supabase start) — only resolvable in dev.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "55921",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
