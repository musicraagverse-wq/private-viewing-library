/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      { source: "/artists", destination: "/actors", permanent: true },
      { source: "/artists/:path*", destination: "/actors/:path*", permanent: true },
      { source: "/artist/:path*", destination: "/actor/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
