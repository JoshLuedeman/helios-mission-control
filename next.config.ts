import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "helioss-mini",
    "helioss-mini.local",
    "helioss-mini.joshluedeman.com",
    "10.0.191.189",
  ],
};

export default nextConfig;
