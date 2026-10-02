/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  optimizeFonts: false, // fonts are loaded in the browser from Google Fonts
  experimental: { serverComponentsExternalPackages: ["pg", "@prisma/adapter-pg"] },
};
