/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Only apply a basePath if the environment variable is explicitly set (e.g. on GitHub Actions)
  ...(process.env.NEXT_PUBLIC_BASE_PATH && { basePath: process.env.NEXT_PUBLIC_BASE_PATH }),
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
