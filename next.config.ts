import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router is enabled by default in Next.js 15+
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: ["images.unsplash.com", "picsum.photos", "i.pravatar.cc"],
      },
    ],
  },
};

export default nextConfig;
