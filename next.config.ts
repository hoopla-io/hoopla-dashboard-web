import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.hoopla.uz",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
