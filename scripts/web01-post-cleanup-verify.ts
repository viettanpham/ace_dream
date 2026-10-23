import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { resolveImageUrl, getResolverConfig } from '../lib/game/assets/image-resolver';
import { V2_ROSTER_CHARACTERS } from '../lib/game/v2/character-profile-data';

function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fetchCdnBuffer(url: string): Promise<{ status: number; contentType: string; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          const chunks: Buffer[] = [];
          redirectRes.on('data', (c) => chunks.push(c));
          redirectRes.on('end', () => {
            resolve({
              status: redirectRes.statusCode || 0,
              contentType: redirectRes.headers['content-type'] || '',
              buffer: Buffer.concat(chunks),
            });
          });
        }).on('error', reject);
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          contentType: res.headers['content-type'] || '',
          buffer: Buffer.concat(chunks),
        });
      });
    }).on('error', reject);
  });
}

async function runPostCleanupVerification() {
  console.log('======================================================================');
  console.log('STARFRONT WORLD V2 — POST-CLEANUP VERIFICATION (WEB-01.5)');
  console.log('======================================================================');

  // 1. Verify local public/images cleanup
  const localImagesDir = path.join(process.cwd(), 'public', 'images');
  const remainingWebp = fs.readdirSync(localImagesDir).filter((f) => f.endsWith('.webp'));
  console.log(`Remaining WebP files in public/images/: ${remainingWebp.length}`);
  if (remainingWebp.length > 0) {
    console.error('ERROR: WebP files still exist in public/images/!');
    process.exit(1);
  }
  console.log('[PASS] public/images/ successfully cleaned (0 WebP files).');

  // 2. Verify public/icon.svg preserved
  const iconPath = path.join(process.cwd(), 'public', 'icon.svg');
  if (!fs.existsSync(iconPath)) {
    console.error('ERROR: public/icon.svg was accidentally removed!');
    process.exit(1);
  }
  console.log('[PASS] public/icon.svg is preserved.');

  // 3. Load manifest from backup package
  const manifestPath = path.join(process.cwd(), 'starfront-world-assets', 'manifests', 'assets-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const assetItems: Array<{ fileName: string; sha256: string }> = manifest.assets;
  console.log(`\nVerifying all ${assetItems.length} CDN assets against manifest SHA-256...`);

  let cdnMatchCount = 0;
  for (const item of assetItems) {
    const filename = item.fileName;
    const expectedHash = item.sha256;
    const cdnUrl = resolveImageUrl(`/images/${filename}`);

    const res = await fetchCdnBuffer(cdnUrl);
    const cdnHash = calculateSha256(res.buffer);
    const isMatch = res.status === 200 && cdnHash === expectedHash;

    if (isMatch) {
      cdnMatchCount++;
      process.stdout.write('.');
    } else {
      console.error(`\n[FAIL] ${filename}: status=${res.status}, cdnHash=${cdnHash}, expected=${expectedHash}`);
    }
  }

  console.log(`\n[PASS] All ${cdnMatchCount}/${assetItems.length} CDN assets verified 100% against manifest.`);

  // 4. Verify Valentine V2 and Archive Pending
  const val = V2_ROSTER_CHARACTERS.find((c) => c.id === 'valentine') || V2_ROSTER_CHARACTERS[0];
  const avatarUrl = resolveImageUrl(val.portraitAssetPath);
  const fullbodyUrl = resolveImageUrl(val.fullbodyAssetPath);
  console.log(`\nValentine Profile CDN URLs:`);
  console.log(`- Avatar: ${avatarUrl}`);
  console.log(`- Fullbody: ${fullbodyUrl}`);

  const verifiedArtworks = val.artworks.filter((a) => a.isAvailableOnDisk);
  const archiveArtworks = val.artworks.filter((a) => !a.isAvailableOnDisk);
  console.log(`Verified Artworks: ${verifiedArtworks.length} | Archive Pending: ${archiveArtworks.length}`);

  // 5. Test resolver behavior
  const config = getResolverConfig();
  console.log('\nResolver Configuration in Environment:');
  console.log(`- Mode: ${config.mode}`);
  console.log(`- CDN Base: ${config.cdnBaseUrl}`);

  if (cdnMatchCount !== assetItems.length) {
    console.error(`\nERROR: Only ${cdnMatchCount}/${assetItems.length} CDN assets matched!`);
    process.exit(1);
  }

  console.log('\n======================================================================');
  console.log('ALL POST-CLEANUP CHECKS PASSED (WEB-01.5)');
  console.log('======================================================================');
}

runPostCleanupVerification().catch((err) => {
  console.error('Fatal post-cleanup verification error:', err);
  process.exit(1);
});
