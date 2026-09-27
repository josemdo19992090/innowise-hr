/** @type {import('next').NextConfig} */
const nextConfig = {
  // unpdf ships its own pdf.js build; keep it out of the server bundle.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
