/** @type {import('next').NextConfig} */
const nextConfig = {
  // V3: Removed `output: 'export'` to enable API Routes and server-side rendering.
  // Deploy to Vercel, Railway, or any Node.js host (not static hosts like GitHub Pages).
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
