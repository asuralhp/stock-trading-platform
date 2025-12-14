import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate a standalone build which outputs a self-contained
  // server in `.next/standalone` that our Dockerfile expects.
  output: 'standalone',
};

export default nextConfig;
