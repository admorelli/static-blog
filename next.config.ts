import type { NextConfig } from "next";

// GitHub Pages repo name - set via environment variable during deployment
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const basePath = repoName ? `/${repoName}` : '';
const assetPrefix = repoName ? `/${repoName}/` : '';

// Only use static export in production builds
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: isDev ? undefined : 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix,
};

export default nextConfig;