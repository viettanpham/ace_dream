// scripts/verify-story-ui-final.ts
import { universalContentResolver } from '../lib/game/v2/universal-content-resolver';

async function runVerification() {
  console.log('=== BẮT ĐẦU KIỂM THỬ STORY UI V2 FINAL ===\n');

  // Test 1: Valentine Catalog & Chapters (01, 02, 03, 07)
  console.log('--- TEST 1: VALENTINE (01, 02, 03, 07) ---');
  const valCatalog = await universalContentResolver.getPilotStoryCatalog('valentine', true);
  if (!valCatalog) throw new Error('Không lấy được catalog của Valentine');
  console.log(`Valentine catalog count: ${valCatalog.chapters.length} chapters (mong đợi 10 chương)`);
  if (valCatalog.chapters.length !== 10) {
    throw new Error(`Valentine phải có 10 chương, thực tế có ${valCatalog.chapters.length}`);
  }

  // Ch01
  const valCh1 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-01');
  if (!valCh1) throw new Error('Không lấy được Valentine Ch01');
  console.log(`Valentine Ch01: Title="${valCh1.meta.title}", contentAvailable=${valCh1.meta.contentAvailable}, proseLength=${valCh1.content.length}`);
  if (!valCh1.meta.contentAvailable || valCh1.content.length < 500) {
    throw new Error('Valentine Ch01 phải có toàn văn văn xuôi!');
  }

  // Ch02
  const valCh2 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-02');
  if (!valCh2) throw new Error('Không lấy được Valentine Ch02');
  console.log(`Valentine Ch02: Title="${valCh2.meta.title}", isComingSoon=${valCh2.isComingSoon}, contentAvailable=${valCh2.meta.contentAvailable}, proseLength=${valCh2.content.length}`);
  if (valCh2.content.length > 0 || !valCh2.isComingSoon) {
    throw new Error('Valentine Ch02 phải là Coming Soon (không có văn xuôi giả)!');
  }

  // Ch03
  const valCh3 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-03');
  if (!valCh3) throw new Error('Không lấy được Valentine Ch03');
  console.log(`Valentine Ch03: Title="${valCh3.meta.title}", isComingSoon=${valCh3.isComingSoon}, summary="${valCh3.meta.summary}"`);
  if (valCh3.content.length > 0 || !valCh3.isComingSoon) {
    throw new Error('Valentine Ch03 phải là Coming Soon!');
  }

  // Ch07
  const valCh7 = await universalContentResolver.getStoryChapterProse('valentine', 'chap-07');
  if (!valCh7) throw new Error('Không lấy được Valentine Ch07');
  console.log(`Valentine Ch07: Title="${valCh7.meta.title}", editorialStatus=${valCh7.meta.editorialStatus}, isComingSoon=${valCh7.isComingSoon}`);
  if (!valCh7.isComingSoon) {
    throw new Error('Valentine Ch07 phải là Coming Soon!');
  }
  console.log('=> TEST 1 PASS!\n');

  // Test 2: Fortuna Catalog & Chapters (01, 03, 07)
  console.log('--- TEST 2: FORTUNA (01, 03, 07) ---');
  const forCatalog = await universalContentResolver.getPilotStoryCatalog('fortuna', true);
  if (!forCatalog) throw new Error('Không lấy được catalog của Fortuna');
  console.log(`Fortuna catalog count: ${forCatalog.chapters.length} chapters (mong đợi 7 chương)`);
  if (forCatalog.chapters.length < 7) {
    throw new Error(`Fortuna phải có ít nhất 7 chương, thực tế ${forCatalog.chapters.length}`);
  }

  for (const cid of ['chap-01', 'chap-03', 'chap-07']) {
    const forCh = await universalContentResolver.getStoryChapterProse('fortuna', cid);
    if (!forCh) throw new Error(`Không lấy được Fortuna ${cid}`);
    console.log(`Fortuna ${cid}: Title="${forCh.meta.title}", isComingSoon=${forCh.isComingSoon}, summary="${forCh.meta.summary}"`);
    if (forCh.content.length > 0 || !forCh.isComingSoon) {
      throw new Error(`Fortuna ${cid} không được có văn xuôi giả và phải là Coming Soon!`);
    }
  }
  console.log('=> TEST 2 PASS!\n');

  // Test 3: Aria Catalog & Chapters (01, 03, 07)
  console.log('--- TEST 3: ARIA (01, 03, 07) ---');
  const ariaCatalog = await universalContentResolver.getPilotStoryCatalog('aria', true);
  if (!ariaCatalog) throw new Error('Không lấy được catalog của Aria');
  console.log(`Aria catalog count: ${ariaCatalog.chapters.length} chapters (mong đợi 7 chương)`);
  if (ariaCatalog.chapters.length < 7) {
    throw new Error(`Aria phải có ít nhất 7 chương, thực tế ${ariaCatalog.chapters.length}`);
  }

  for (const cid of ['chap-01', 'chap-03', 'chap-07']) {
    const ariaCh = await universalContentResolver.getStoryChapterProse('aria', cid);
    if (!ariaCh) throw new Error(`Không lấy được Aria ${cid}`);
    console.log(`Aria ${cid}: Title="${ariaCh.meta.title}", isComingSoon=${ariaCh.isComingSoon}, summary="${ariaCh.meta.summary}"`);
    if (ariaCh.content.length > 0 || !ariaCh.isComingSoon) {
      throw new Error(`Aria ${cid} không được có văn xuôi giả và phải là Coming Soon!`);
    }
  }
  console.log('=> TEST 3 PASS!\n');

  // Test 4: Dynamic catalog for all 12 pilots
  console.log('--- TEST 4: TẤT CẢ 12 PHI CÔNG CANONICAL ---');
  const allPilots = [
    'alviss', 'eric', 'marcus', 'victor',
    'kaelen', 'lyra', 'selena', 'valentine',
    'fortuna', 'aria', 'rhea', 'nova'
  ];

  for (const p of allPilots) {
    const cat = await universalContentResolver.getPilotStoryCatalog(p as any, true);
    if (!cat) throw new Error(`Không lấy được catalog của ${p}`);
    const chCount = cat.chapters.length;
    console.log(`Pilot [${p.padEnd(10)}]: ${chCount} chương public (Ch01: "${cat.chapters[0]?.title}")`);
    if (chCount < 7) {
      throw new Error(`Pilot ${p} thiếu chương! Chỉ có ${chCount} chương`);
    }
  }
  console.log('=> TEST 4 PASS!\n');

  console.log('=== TẤT CẢ CÁC BÀI TEST CHỨC NĂNG VÀ DATA ĐỀU ĐẠT CHUẨN PASS! ===');
}

runVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
