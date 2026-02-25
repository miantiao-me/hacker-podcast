/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: () => [
    {
      source: '/blog.xml',
      destination: '/rss.xml',
    },
  ],
}

export default nextConfig
