// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;



import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Your existing config options here */
  
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
  },
};

export default nextConfig;
