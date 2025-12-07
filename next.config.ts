import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['koffi', '@reclaimprotocol/zk-fetch'],
};

export default nextConfig;
