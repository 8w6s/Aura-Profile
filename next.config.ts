import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_APP_NAME: "Aura Profile",
    NEXT_PUBLIC_APP_VERSION: "0.1.0-beta",
    NEXT_PUBLIC_BUILD_USER: "8w6s",
  },
};

export default nextConfig;
