/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/project-documents": ["./node_modules/pdfjs-dist/legacy/build/**/*"],
  },
};

export default nextConfig;
