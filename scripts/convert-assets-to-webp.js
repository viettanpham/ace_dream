const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PILOTS = [
  'marcus',
  'valentine',
  'alviss',
  'eric',
  'lyra',
  'kaelen',
  'selena',
  'victor',
  'levi',
];

const GEARS = [
  'vanguard-gear',
  'falcon-gear',
  'aegis-gear',
];

const IMAGES_DIR = path.join(process.cwd(), 'public/images');

async function convertAll() {
  console.log('='.repeat(80));
  console.log('STARFRONT ASSET CONVERTER TO WEBP (PHASE 1)');
  console.log('='.repeat(80));

  const results = [];

  // 1. Convert Portraits (Target: 512x512, Alpha Preserved, WebP Q92)
  for (const pilot of PILOTS) {
    const srcPng = path.join(IMAGES_DIR, `${pilot}-portrait.png`);
    const destWebp = path.join(IMAGES_DIR, `${pilot}-portrait.webp`);

    if (fs.existsSync(srcPng)) {
      const srcStat = fs.statSync(srcPng);
      const srcMeta = await sharp(srcPng).metadata();

      await sharp(srcPng)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 92, alphaQuality: 100, lossless: false })
        .toFile(destWebp);

      const destStat = fs.statSync(destWebp);
      const destMeta = await sharp(destWebp).metadata();

      results.push({
        type: 'Portrait (1:1)',
        file: `${pilot}-portrait.webp`,
        origDim: `${srcMeta.width}x${srcMeta.height}`,
        destDim: `${destMeta.width}x${destMeta.height}`,
        origSizeKB: (srcStat.size / 1024).toFixed(1),
        destSizeKB: (destStat.size / 1024).toFixed(1),
        savings: (100 - (destStat.size / srcStat.size) * 100).toFixed(1) + '%',
      });
    }
  }

  // 2. Convert Full-body (Target: 1080x1920 FullHD 9:16, Alpha Preserved, WebP Q92)
  for (const pilot of PILOTS) {
    const srcPng = path.join(IMAGES_DIR, `${pilot}-fullbody.png`);
    const destWebp = path.join(IMAGES_DIR, `${pilot}-fullbody.webp`);

    if (fs.existsSync(srcPng)) {
      const srcStat = fs.statSync(srcPng);
      const srcMeta = await sharp(srcPng).metadata();

      await sharp(srcPng)
        .resize(1080, 1920, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 92, alphaQuality: 100, lossless: false })
        .toFile(destWebp);

      const destStat = fs.statSync(destWebp);
      const destMeta = await sharp(destWebp).metadata();

      results.push({
        type: 'Full-body (9:16)',
        file: `${pilot}-fullbody.webp`,
        origDim: `${srcMeta.width}x${srcMeta.height}`,
        destDim: `${destMeta.width}x${destMeta.height}`,
        origSizeKB: (srcStat.size / 1024).toFixed(1),
        destSizeKB: (destStat.size / 1024).toFixed(1),
        savings: (100 - (destStat.size / srcStat.size) * 100).toFixed(1) + '%',
      });
    }
  }

  // 3. Convert Gear Artworks (Target: WebP Q90)
  for (const gear of GEARS) {
    const srcJpg = path.join(IMAGES_DIR, `${gear}.jpg`);
    const destWebp = path.join(IMAGES_DIR, `${gear}.webp`);

    if (fs.existsSync(srcJpg)) {
      const srcStat = fs.statSync(srcJpg);
      const srcMeta = await sharp(srcJpg).metadata();

      await sharp(srcJpg)
        .webp({ quality: 90 })
        .toFile(destWebp);

      const destStat = fs.statSync(destWebp);
      const destMeta = await sharp(destWebp).metadata();

      results.push({
        type: 'Gear Artwork',
        file: `${gear}.webp`,
        origDim: `${srcMeta.width}x${srcMeta.height}`,
        destDim: `${destMeta.width}x${destMeta.height}`,
        origSizeKB: (srcStat.size / 1024).toFixed(1),
        destSizeKB: (destStat.size / 1024).toFixed(1),
        savings: (100 - (destStat.size / srcStat.size) * 100).toFixed(1) + '%',
      });
    }
  }

  console.log(
    'Loại'.padEnd(18) +
    'Tệp WebP'.padEnd(25) +
    'Kích thước cũ'.padEnd(16) +
    'Kích thước mới'.padEnd(16) +
    'Dung lượng cũ'.padEnd(16) +
    'Dung lượng mới'.padEnd(16) +
    'Tiết kiệm'
  );
  console.log('-'.repeat(110));

  let totalOrigKB = 0;
  let totalDestKB = 0;

  for (const r of results) {
    totalOrigKB += parseFloat(r.origSizeKB);
    totalDestKB += parseFloat(r.destSizeKB);
    console.log(
      r.type.padEnd(18) +
      r.file.padEnd(25) +
      r.origDim.padEnd(16) +
      r.destDim.padEnd(16) +
      (r.origSizeKB + ' KB').padEnd(16) +
      (r.destSizeKB + ' KB').padEnd(16) +
      r.savings
    );
  }

  console.log('-'.repeat(110));
  const totalSavings = (100 - (totalDestKB / totalOrigKB) * 100).toFixed(1) + '%';
  console.log(
    'TỔNG CỘNG:'.padEnd(43) +
    ''.padEnd(32) +
    ((totalOrigKB / 1024).toFixed(2) + ' MB').padEnd(16) +
    ((totalDestKB / 1024).toFixed(2) + ' MB').padEnd(16) +
    totalSavings
  );
}

convertAll().catch(console.error);
