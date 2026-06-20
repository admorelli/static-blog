import fs from 'fs';
import path from 'path';

/**
 * Post-process HTML to enhance images with responsive attributes
 * Finds optimized image versions and adds srcset, sizes, loading="lazy", blur placeholder
 */
export function enhanceImages(html: string, _baseUrl: string = ''): string {
  // Match <img> tags and enhance them
  // Pattern: <img src="/images/posts/slug/image.png" ...>
  const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;

  return html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">').replace(imgRegex, (match, beforeSrc, src, afterSrc) => {
    // Only process images from our posts images directory
    if (!src.startsWith('/images/posts/')) {
      return match;
    }

    const slugMatch = src.match(/\/images\/posts\/([^/]+)\//);
    if (!slugMatch) {
      return match;
    }

    const slug = slugMatch[1];
    const fileName = path.basename(src);
    const baseName = path.parse(fileName).name;

    // Check if optimized versions exist
    const postsDir = path.join(process.cwd(), 'public', 'images', 'posts', slug);
    if (!fs.existsSync(postsDir)) {
      return match;
    }

    // Check for optimized WebP versions
    const sizeOptions = [400, 800, 1200];
    const webpFiles: { width: number; path: string }[] = [];

    for (const size of sizeOptions) {
      const webpFile = `${baseName}-${size}w.webp`;
      const webpPath = path.join(postsDir, webpFile);
      if (fs.existsSync(webpPath)) {
        webpFiles.push({ width: size, path: `/images/posts/${slug}/${webpFile}` });
      }
    }

    if (webpFiles.length === 0) {
      return match;
    }

    // Generate srcset
    const srcset = webpFiles.map(f => `${f.path} ${f.width}w`).join(', ');
    const sizesAttr = webpFiles.length > 1 ? '(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px' : '100vw';

    // Check for blur placeholder
    let blurDataUri = '';
    const blurFile = path.join(postsDir, `${baseName}-blur.txt`);
    if (fs.existsSync(blurFile)) {
      blurDataUri = fs.readFileSync(blurFile, 'utf-8');
    }

    // Build enhanced img tag
    const altMatch = match.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';
    const afterSrcClean = afterSrc.replace(/\s*alt=["'][^"']*["']/i, '');

    let enhanced = `<img ${beforeSrc.trim()} src="${src}"`;

    if (srcset) {
      enhanced += ` srcset="${srcset}" sizes="${sizesAttr}" type="image/webp"`;
    }

    if (blurDataUri) {
      enhanced += ` style="background-image: url('${blurDataUri}'); background-size: cover; background-position: center; min-height: 20px; filter: blur(20px); transition: filter 0.3s ease;" onload="this.style.filter='none'; this.style.backgroundImage='none'"`;
    }

    enhanced += ` loading="lazy" decoding="async" alt="${alt}"${afterSrcClean.trim()}>`;

    return enhanced;
  });
}

/**
 * Process markdown content with enhanced images
 * Use this after marked.parse() to add responsive image attributes
 */
export function processMarkdownImages(html: string, _baseUrl: string = ''): string {
  if (typeof window !== 'undefined') {
    // Client-side: can only add loading="lazy" if not already present
    return html.replace(/<img\s+([^>]*?)>/gi, (match) => {
      if (!match.includes('loading=')) {
        return match.replace('<img ', '<img loading="lazy" decoding="async" ');
      }
      return match;
    });
  }

  // Server-side: enhance with srcset, sizes, blur placeholder
  return enhanceImages(html, _baseUrl);
}
