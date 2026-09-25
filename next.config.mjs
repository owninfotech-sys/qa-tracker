/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mysql2"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|favicon.png|icon.png|apple-icon.png|not-found.lottie|UXwLB9npXu.lottie).*)",
        headers: [{ key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
