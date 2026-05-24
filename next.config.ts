import type { NextConfig } from "next";
const path = require('path')

const nextConfig: NextConfig = {
  /*some config goes here*/
}
module.exports = {
  turbopack: {
    root: path.join(__dirname, '.'),
    rules: {
      // '*' will match all file paths, but we restrict where our
      // rule runs with a condition.
      '*': {
        condition: {
          all: [
            // 'foreign' is a built-in condition.
            { not: 'foreign' },
            // 'path' can be a RegExp or a glob string. A RegExp matches
            // anywhere in the full project-relative file path.
            { path: /^img\/[0-9]{3}\// },
            {
              any: [
                { path: '*.svg' },
                // 'query' matches anywhere in the full query string,
                // which can be empty, or start with `?`.
                { query: /[?&]svgr(?=&|$)/ },
                // 'content' is always a RegExp, and can match
                // anywhere in the file.
                { content: /\<svg\W/ },
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
