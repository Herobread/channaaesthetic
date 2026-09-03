import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "next-sanity",
    "sanity",
    "@sanity/sdk-react",
    "@sanity/workbench",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
