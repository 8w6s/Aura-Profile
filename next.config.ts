import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(projectRoot),
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "Aura Profile",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_BUILD_USER: "8w6s",
  },
};

export default nextConfig;
