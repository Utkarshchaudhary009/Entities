/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allows all Supabase project URLs
      },
    ],
  },
}

module.exports = nextConfig