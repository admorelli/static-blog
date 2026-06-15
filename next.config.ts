import type { NextConfig } from "next";
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
  turbopack: {
    root: path.join(__dirname, '.'),
    rules: {
      '*': {
        condition: {
          all: [
            { not: 'foreign' },
            { path: /^img\/[0-9]{3}\// },
            {
              any: [
                { path: '*.svg' },
                { query: /[?&]svgr(?=&|$)/ },
                { content: /\\<svg\\W/ },
              ],
            },
          ],
        },
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig;
