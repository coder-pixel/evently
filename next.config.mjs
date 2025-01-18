/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["utfs.io"], // Add the hostname here
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
    ],
  },
};

export default nextConfig;
