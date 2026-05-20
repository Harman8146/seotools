// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;



import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Your existing config options here */
  
  experimental: {
    // This forces Next.js to include cheerio inside the serverless functions
    serverComponentsExternalPackages: ['cheerio'],
  },
};

export default nextConfig;
