/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for cPanel shared hosting
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Trailing slash for better routing on shared hosting
  trailingSlash: true,
  
  // Disable server-side features that don't work with static export
  distDir: 'out'
}

module.exports = nextConfig
