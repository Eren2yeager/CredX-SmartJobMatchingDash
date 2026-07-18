import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // The persistent dev cache can deadlock on this Windows workspace.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
