import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- ADD THIS SECTION ---
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allows large uploads (default is only 1MB-4MB)
    },
  },
  // ------------------------

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Allow Cloudinary images
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Allow placeholders
      },
    ],
  },
};

export default nextConfig;