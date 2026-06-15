import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')

// GitHub Pages repo name - set via environment variable during deployment
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const basePath = repoName ? `/${repoName}` : '';
const assetPrefix = repoName ? `/${repoName}/` : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix,
}

export default nextConfig;