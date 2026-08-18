import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route groups + typed routes don't play well in Next 16 (the type validator
  // looks for a literal src/app/page.js even when the root lives in (app)).
  typedRoutes: false,
};

export default nextConfig;
