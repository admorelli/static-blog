// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

interface Manifest {
  id: string;
  original: string;
  src: string;
  srcset: string;
  sizes: string;
  blurDataUri: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

async function optimizeImages() {
  console.log('Optimizing images...');

  const postsDir = path.join(process.cwd(), 'public', 'posts');

  if (!fs.existsSync(postsDir)) {
    console.log('No posts directory found, skipping optimization');
    return;
  }

  const slugs = fs
    .readdirSync(postsDir)
    .filter((f) => fs.statSync(path.join(postsDir, f)).isDirectory());

  const sizes = [400, 800, 1200];
  const quality = 80;
  const formats = ['webp', 'avif'];

  for (const slug of slugs) {
    const imgDir = path.join(postsDir, slug, 'img');
    if (!fs.existsSync(imgDir) || !fs.statSync(imgDir).isDirectory()) {
      continue;
    }

    const ids = fs
      .readdirSync(imgDir)
      .filter((id) => fs.statSync(path.join(imgDir, id)).isDirectory());

    for (const id of ids) {
      const imageDir = path.join(imgDir, id);
      const files = fs
        .readdirSync(imageDir)
        .filter((f: string) => {
          const ext = path.extname(f).toLowerCase();
          return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
        });

      for (const originalFile of files) {
        if (!(originalFile.endsWith('.png') || originalFile.endsWith('.jpg') || originalFile.endsWith('.jpeg') || originalFile.endsWith('.webp'))) continue;
        if (path.parse(originalFile).name.match(/-\d+w$/)) continue;

        const inputPath = path.join(imageDir, originalFile);
        const baseName = path.parse(originalFile).name;
        const ext = path.extname(originalFile).toLowerCase();

        console.log(`  Optimizing: ${slug}/img/${id}/${originalFile}`);

        try {
          const image = sharp(inputPath);
          const metadata = await image.metadata();
          const srcsetEntries: string[] = [];
          const sizesParts: string[] = [];

          for (const size of sizes) {
            if (metadata.width && metadata.width > size) {
              const suffix = `${size}w`;
              srcsetEntries.push(`${baseName}-${suffix}.webp ${suffix}`);
              const media = size === 400 ? '(max-width: 640px)' : size === 800 ? '(max-width: 1024px)' : undefined;
              sizesParts.push(`${size}px${media ? ` ${media}` : ''}`);
            }
          }

          if (!srcsetEntries.length) {
            srcsetEntries.push(`${baseName}.webp`);
            sizesParts.push(`${metadata.width ?? 'auto'}`);
          }

          for (const size of sizes) {
            if (metadata.width && metadata.width > size) {
              for (const format of formats) {
                const outputPath = path.join(imageDir, `${baseName}-${size}w.${format}`);
                await image
                  .resize({ width: size, withoutEnlargement: true })
                  .toFormat(format, { quality })
                  .toFile(outputPath);
              }
            }
          }

          for (const format of formats) {
            const outputPath = path.join(imageDir, `${baseName}-max.${format}`);
            await image
              .toFormat(format, { quality })
              .toFile(outputPath);
          }

          if (metadata.width && metadata.width > 1200) {
            for (const format of formats) {
              const outputPath = path.join(imageDir, `${baseName}-max-max.${format}`);
              await image
                .toFormat(format, { quality })
                .toFile(outputPath);
            }
          }

          const blurPlaceholder = await image
            .resize({ width: 20 })
            .blur(20)
            .webp({ quality: 50 })
            .toBuffer();

          const blurDataUri = `data:image/webp;base64,${blurPlaceholder.toString('base64')}`;
          const srcset = srcsetEntries.map((entry) => `/posts/${slug}/img/${id}/${entry}`).join(', ');
          const src = `/posts/${slug}/img/${id}/max.webp`;

          const manifest: Manifest = {
            id,
            original: `${baseName}${ext}`,
            src,
            srcset,
            sizes: sizesParts.join(', '),
            blurDataUri,
            width: metadata.width ?? null,
            height: metadata.height ?? null,
            createdAt: new Date().toISOString(),
          };

          const manifestPath = path.join(imageDir, 'manifest.json');
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`    Generated: manifest.json`);
        } catch (e) {
          console.error(`    Error optimizing ${originalFile}:`, (e as Error).message);
        }
      }
    }
  }

  console.log('✅ Image optimization complete');
}

if (require.main === module) {
  optimizeImages().catch((e) => {
    console.error('Image optimization failed:', e);
    process.exit(1);
  });
}

module.exports = { optimizeImages };
