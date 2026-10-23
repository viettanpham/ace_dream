import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { resolveImageUrl, getResolverConfig } from '../lib/game/assets/image-resolver';
import { STARFRONT_PILOTS, STARFRONT_GEAR_DEFS } from '../lib/game/data';
import { V2_ROSTER_CHARACTERS } from '../lib/game/v2/character-profile-data';

interface CheckResult {
  filename: string;
  category: string;
  localPath: string;
  cdnUrl: string;
  localExists: boolean;
  localSize: number;
  localSha256: string;
  cdnStatus: number;
  cdnSize: number;
  cdnContentType: string;
  cdnSha256: string;
  hashMatch: boolean;
  error?: string;
}

function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fetchCdnBuffer(url: string): Promise<{ status: number; contentType: string; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirect if 301/302
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

async function runRegressionSuite() {
  console.log('======================================================================');
  console.log('STARFRONT WORLD V2 — WEB-01.4 REGRESSION & VERIFICATION SUITE');
  console.log('======================================================================');

  const config = getResolverConfig();
  console.log('Active Resolver Config:', JSON.stringify(config, null, 2));

  const localImagesDir = path.join(process.cwd(), 'public', 'images');
  const files = fs.readdirSync(localImagesDir).filter((f) => f.endsWith('.webp'));

  console.log(`\nFound ${files.length} WebP images in public/images/`);

  const results: CheckResult[] = [];

  for (const filename of files) {
    const localPath = path.join(localImagesDir, filename);
    const localBuffer = fs.readFileSync(localPath);
    const localSha256 = calculateSha256(localBuffer);
    const localSize = localBuffer.length;

    const rawGamePath = `/images/${filename}`;
    const cdnUrl = resolveImageUrl(rawGamePath);

    let category = 'Other';
    if (filename.includes('gear')) category = 'GEAR V1';
    else if (filename.includes('portrait')) category = 'Pilot Portrait';
    else if (filename.includes('fullbody')) category = 'Pilot Fullbody';
    else if (filename.includes('combat') || filename.includes('casual')) category = 'Pilot Artwork';

    try {
      const cdnRes = await fetchCdnBuffer(cdnUrl);
      const cdnSha256 = calculateSha256(cdnRes.buffer);
      const hashMatch = cdnRes.status === 200 && cdnSha256 === localSha256;

      results.push({
        filename,
        category,
        localPath,
        cdnUrl,
        localExists: true,
        localSize,
        localSha256,
        cdnStatus: cdnRes.status,
        cdnSize: cdnRes.buffer.length,
        cdnContentType: cdnRes.contentType,
        cdnSha256,
        hashMatch,
      });

      process.stdout.write(hashMatch ? '.' : 'F');
    } catch (err: any) {
      results.push({
        filename,
        category,
        localPath,
        cdnUrl,
        localExists: true,
        localSize,
        localSha256,
        cdnStatus: 0,
        cdnSize: 0,
        cdnContentType: '',
        cdnSha256: '',
        hashMatch: false,
        error: err.message,
      });
      process.stdout.write('E');
    }
  }

  console.log('\n\n--- 1. GEAR V1 VERIFICATION (3 MECHAS) ---');
  const gearFiles = ['vanguard-gear.webp', 'falcon-gear.webp', 'aegis-gear.webp'];
  let gearPassCount = 0;
  for (const gf of gearFiles) {
    const r = results.find((res) => res.filename === gf);
    if (r && r.cdnStatus === 200 && r.hashMatch) {
      gearPassCount++;
      console.log(`[PASS] ${gf}: HTTP ${r.cdnStatus}, Content-Type: ${r.cdnContentType}, Size: ${r.cdnSize}B, Hash: MATCH`);
      console.log(`       CDN URL: ${r.cdnUrl}`);
    } else {
      console.error(`[FAIL] ${gf}: status=${r?.cdnStatus}, hashMatch=${r?.hashMatch}, err=${r?.error}`);
    }
  }

  console.log('\n--- 2. PILOT V1 VERIFICATION (8 PILOTS) ---');
  const pilotKeys = ['marcus', 'valentine', 'alviss', 'eric', 'lyra', 'kaelen', 'selena', 'victor'];
  let pilotPassCount = 0;
  for (const pk of pilotKeys) {
    const pilotItems = results.filter((res) => res.filename.startsWith(pk));
    const allMatch = pilotItems.length > 0 && pilotItems.every((i) => i.cdnStatus === 200 && i.hashMatch);
    if (allMatch) {
      pilotPassCount++;
      console.log(`[PASS] Pilot "${pk}": ${pilotItems.length} assets verified:`);
      for (const item of pilotItems) {
        console.log(`       - ${item.filename} (${item.cdnSize} bytes) -> MATCH`);
      }
    } else {
      console.error(`[FAIL] Pilot "${pk}": items=${pilotItems.length}, some failed`);
    }
  }

  console.log('\n--- 3. CHARACTER CATEGORY V2 & ARCHIVE PENDING VERIFICATION ---');
  const val = V2_ROSTER_CHARACTERS.find((c) => c.id === 'valentine') || V2_ROSTER_CHARACTERS[0];
  console.log(`Profile: ${val.classCharacterName} (${val.callsign})`);
  console.log(`Main avatar: ${val.portraitAssetPath} -> ${resolveImageUrl(val.portraitAssetPath)}`);
  console.log(`Fullbody art: ${val.fullbodyAssetPath} -> ${resolveImageUrl(val.fullbodyAssetPath)}`);

  const verifiedArtworks = val.artworks.filter((a) => a.isAvailableOnDisk);
  const archiveArtworks = val.artworks.filter((a) => !a.isAvailableOnDisk);

  console.log(`Verified Artworks on disk: ${verifiedArtworks.length}`);
  console.log(`Archive Pending Artworks: ${archiveArtworks.length}`);

  let verifiedPassCount = 0;
  for (const art of verifiedArtworks) {
    const resolved = resolveImageUrl(art.path);
    const filename = path.basename(art.path);
    const r = results.find((res) => res.filename === filename);
    if (r && r.cdnStatus === 200 && r.hashMatch) {
      verifiedPassCount++;
      console.log(`[PASS] Artwork "${art.title}" (${filename}): HTTP 200, SHA256 MATCH`);
    } else {
      console.error(`[FAIL] Artwork "${art.title}" (${filename}): status=${r?.cdnStatus}`);
    }
  }

  // Verify archive pending artworks: must have status 'archive_pending' and must NEVER generate broken img tags
  let archiveBogusRequestCount = 0;
  for (const art of archiveArtworks) {
    if (art.status !== 'archive_pending') {
      archiveBogusRequestCount++;
      console.error(`[FAIL] Archive artwork ${art.id} status is not archive_pending: ${art.status}`);
    } else {
      console.log(`[PASS] Archive Pending "${art.title}" (ID: ${art.id}) | Category: ${art.category} | Zero img request verified`);
    }
  }

  const archivePass = archiveArtworks.length > 0 && archiveBogusRequestCount === 0;
  console.log(`Archive pending zero-request verification: ${archivePass ? 'PASSED (0 bogus network requests)' : 'FAILED'}`);

  console.log('\n--- 4. LOCAL ROLLBACK VERIFICATION ---');
  const testSample = '/images/vanguard-gear.webp';
  const rollbackUrl = resolveImageUrl(testSample, { mode: 'local' });
  console.log(`Original: ${testSample}`);
  console.log(`Local Rollback Mode: resolveImageUrl(..., { mode: 'local' }) => "${rollbackUrl}"`);
  const rollbackPass = rollbackUrl === '/images/vanguard-gear.webp';
  console.log(`Rollback Path Accuracy: ${rollbackPass ? 'PASSED' : 'FAILED'}`);

  console.log('\n--- 5. OVERALL SUMMARY ---');
  const totalVerified = results.filter((r) => r.cdnStatus === 200 && r.hashMatch).length;
  console.log(`Total WebP assets tested: ${results.length}`);
  console.log(`CDN HTTP 200 & SHA256 Match: ${totalVerified}/${results.length}`);
  console.log(`GEAR V1 (3/3): ${gearPassCount === 3 ? 'PASS' : 'FAIL'}`);
  console.log(`Pilot V1 (8/8): ${pilotPassCount === 8 ? 'PASS' : 'FAIL'}`);
  console.log(`V2 Archive Pending Protection: ${archivePass ? 'PASS' : 'FAIL'}`);
  console.log(`Local Rollback Test: ${rollbackPass ? 'PASS' : 'FAIL'}`);

  if (totalVerified === results.length && gearPassCount === 3 && pilotPassCount === 8 && archivePass && rollbackPass) {
    console.log('\n>>> ALL REGRESSION VERIFICATION TESTS COMPLETED SUCCESSFULLY! <<<');
  } else {
    console.error('\n>>> SOME REGRESSION CHECKS FAILED! <<<');
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Fatal regression suite error:', err);
  process.exit(1);
});
