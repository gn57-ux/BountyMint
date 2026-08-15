import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // See src/lib/stub-base-account.ts for why.
      "@base-org/account": "./src/lib/stub-base-account.ts",
    },
  },
};

export default nextConfig;
