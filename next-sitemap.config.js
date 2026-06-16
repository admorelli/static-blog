/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-username.github.io/static_blog',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ['/create', '/404', '/sitemap.xml'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' }
    ],
    additionalSitemaps: [
      'https://your-username.github.io/static_blog/sitemap.xml'
    ]
  },
  transform: async (config, path) => {
    const priorityMap = {
      '/': 1.0,
      '/posts': 0.9,
    };
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priorityMap[path] || 0.7,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  additionalPaths: async (_config) => {
    // Read posts from generated static data
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'public', 'data', 'posts-index.json');
    
    if (!fs.existsSync(dataPath)) {
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const posts = data.posts || [];
    
    return posts.map((post) => ({
      loc: `/posts/${post.slug}`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date(post.created_at * 1000).toISOString(),
    }));
  },
};