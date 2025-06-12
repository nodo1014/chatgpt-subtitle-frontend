import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: {
      rules: {
        "*.ts": {
          loaders: ["swc-loader"],
          as: "*.js",
        },
        "*.tsx": {
          loaders: ["swc-loader"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
