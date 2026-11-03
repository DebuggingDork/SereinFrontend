import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // The backend is proxied through this origin so the gate pass cookie is
  // first-party here and readable by proxy.ts on every navigation.
  async rewrites() {
    return [{ source: "/api/backend/:path*", destination: `${backendUrl}/:path*` }];
  },
  // Diet became Health, so old bookmarks and home screen shortcuts still land.
  async redirects() {
    return [
      { source: "/diet", destination: "/health", permanent: true },
      { source: "/diet/:path*", destination: "/health/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
