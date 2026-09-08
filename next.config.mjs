/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mysql2"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
