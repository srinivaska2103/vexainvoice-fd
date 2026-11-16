/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  devIndicators: false,
  images: {
    unoptimized: true
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '10.44.89.42'],
};

export default nextConfig;
