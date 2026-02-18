import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
