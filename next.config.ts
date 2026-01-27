import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.hoopla.uz",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "files.hoopla.uz",
        pathname: "/images/**",
      }
    ],
  },
};

export default nextConfig;
