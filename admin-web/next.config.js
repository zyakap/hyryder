/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hyryder/shared-types"],
  images: {
    domains: ["localhost", "hyryder-documents.s3.ap-southeast-2.amazonaws.com"],
  },
};

module.exports = nextConfig;
