/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["i.ytimg.com", "yt3.ggpht.com", "yt3.googleusercontent.com", "i.imgur.com"],
    unoptimized: true,
  },
}

module.exports = nextConfig
