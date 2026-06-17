// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

async function optimizeImages() {
  console.log('Optimizing images...');
  
  const postsDir = path.join(process.cwd(), 'public', 'images', 'posts');
  
  if (!fs.existsSync(postsDir)) {
    console.log('No posts images directory found, skipping optimization');
    return;
  }
  
  const slugs = fs.readdirSync(postsDir).filter(f => fs.statSync(path.join(postsDir, f)).isDirectory());
  
  const sizes = [400, 800, 1200];
  const quality = 80;
  const formats = ['webp', 'avif'];
  
  for (const slug of slugs) {
    const slugDir = path.join(postsDir, slug);
    const files = fs.readdirSync(slugDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });
    
    for (const file of files) {
      const inputPath = path.join(slugDir, file);
      const baseName = path.parse(file).name;
      const ext = path.extname(file).toLowerCase();
      
      // Skip if already optimized (has size suffix)
      if (baseName.match(/-\d+w$/)) continue;
      
      console.log(`  Optimizing: ${slug}/${file}`);
      
      try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Generate responsive sizes
        for (const size of sizes) {
          if (metadata.width && metadata.width > size) {
            for (const format of formats) {
              const outputPath = path.join(slugDir, `${baseName}-${size}w.${format}`);
              await image
                .resize({ width: size, withoutEnlargement: true })
                .toFormat(format, { quality })
                .toFile(outputPath);
              console.log(`    Generated: ${baseName}-${size}w.${format}`);
            }
          }
        }
        
        // Generate blur placeholder (base64 tiny image)
        const blurPlaceholder = await image
          .resize({ width: 20 })
          .blur(20)
          .webp({ quality: 50 })
          .toBuffer();
        
        const blurDataUri = `data:image/webp;base64,${blurPlaceholder.toString('base64')}`;
        const blurPath = path.join(slugDir, `${baseName}-blur.txt`);
        fs.writeFileSync(blurPath, blurDataUri);
        console.log(`    Generated: blur placeholder`);
        
      } catch (e) {
        console.error(`    Error optimizing ${file}:`, e.message);
      }
    }
  }
  
  console.log('✅ Image optimization complete');
}

if (require.main === module) {
  optimizeImages().catch(e => {
    console.error('Image optimization failed:', e);
    process.exit(1);
  });
}

module.exports = { optimizeImages };