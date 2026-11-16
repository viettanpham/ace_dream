/**
 * STARFRONT WORLD V2 — UNIT TESTS FOR STORY PROGRESS ADAPTER (FND-8.2.3.E.1 · T2)
 */

import assert from 'node:assert/strict'
import {
  STORY_PROGRESS_STORAGE_KEY,
  loadPilotStoryProgress,
  loadStoryProgressStore,
  markChapterInProgress,
  markChapterCompleted,
  getEffectiveChapterProgress,
  getNextUnreadChapter,
  getContinueReadingChapter,
} from '../lib/game/v2/story-progress'

function createMemoryStorage(initial?: Record<string, string>): Storage {
  const map = new Map<string, string>(Object.entries(initial || {}))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

function createThrowingStorage(): Storage {
  return {
    length: 0,
    clear() {
      throw new Error('Storage disabled')
    },
    getItem() {
      throw new Error('Storage disabled')
    },
    key() {
      return null
    },
    removeItem() {
      throw new Error('Storage disabled')
    },
    setItem() {
      throw new Error('Storage disabled')
    },
  }
}

const VALENTINE_CHAPTERS = [
  { id: 'chap-01', number: 1, revision: '16', isAvailable: true },
  { id: 'chap-02', number: 2, revision: '10', isAvailable: true },
  { id: 'chap-03', number: 3, revision: '03', isAvailable: true },
  { id: 'chap-04', number: 4, revision: '03_RECONSTRUCTION', isAvailable: true },
  { id: 'chap-05', number: 5, revision: '02', isAvailable: true },
]

function runTests() {
  console.log('▶ [TEST 1] SSR-safe & storage unavailable fallback...')
  const ssrProgress = loadPilotStoryProgress('valentine')
  assert.equal(ssrProgress.pilotId, 'valentine')
  assert.deepEqual(ssrProgress.chapters, {})
  assert.equal(ssrProgress.lastActiveChapterId, null)

  const throwingStorage = createThrowingStorage()
  const safeFromThrow = markChapterInProgress('valentine', 'chap-01', {
    scrollPercent: 45,
    revision: '16',
    storage: throwingStorage,
  })
  assert.equal(safeFromThrow.pilotId, 'valentine')
  assert.equal(safeFromThrow.chapters['chap-01']?.status, 'in_progress')
  const safeLoadFromThrow = loadPilotStoryProgress('valentine', throwingStorage)
  assert.deepEqual(safeLoadFromThrow.chapters, {})
  console.log('  ✓ PASS')

  console.log('▶ [TEST 2] Corrupt JSON & isolated storage key...')
  const corruptStorage = createMemoryStorage({
    [STORY_PROGRESS_STORAGE_KEY]: '{invalid-json!!!',
    sf_v2_ui_prefs: '{"heroBackgroundMode":"clean"}',
    sf_v2_gear_loadout: '{"locked":true}',
  })
  const storeAfterCorrupt = loadStoryProgressStore(corruptStorage)
  assert.deepEqual(storeAfterCorrupt.pilots, {})
  assert.equal(corruptStorage.getItem('sf_v2_ui_prefs'), '{"heroBackgroundMode":"clean"}')
  assert.equal(corruptStorage.getItem('sf_v2_gear_loadout'), '{"locked":true}')
  console.log('  ✓ PASS')

  console.log('▶ [TEST 3] In-progress, >=90% auto-complete, and non-downgrade on reopen...')
  const storage = createMemoryStorage({
    sf_v2_ui_prefs: '{"activePilotTab":"story"}',
  })

  markChapterInProgress('valentine', 'chap-01', {
    scrollPercent: 35,
    revision: '16',
    now: '2026-11-15T10:00:00.000Z',
    storage,
  })
  let valState = loadPilotStoryProgress('valentine', storage)
  assert.equal(valState.chapters['chap-01'].status, 'in_progress')
  assert.equal(valState.chapters['chap-01'].scrollPercent, 35)
  assert.equal(valState.chapters['chap-01'].lastRevisionSeen, '16')
  assert.equal(valState.lastActiveChapterId, 'chap-01')

  // Scroll >= 90% auto-marks completed
  markChapterInProgress('valentine', 'chap-01', {
    scrollPercent: 92,
    revision: '16',
    now: '2026-11-15T10:05:00.000Z',
    storage,
  })
  valState = loadPilotStoryProgress('valentine', storage)
  assert.equal(valState.chapters['chap-01'].status, 'completed')
  assert.equal(valState.chapters['chap-01'].scrollPercent, 92)

  // Reopening completed chapter at scrollTop=0 with SAME revision preserves completed
  markChapterInProgress('valentine', 'chap-01', {
    scrollPercent: 0,
    revision: '16',
    now: '2026-11-15T10:06:00.000Z',
    storage,
  })
  valState = loadPilotStoryProgress('valentine', storage)
  assert.equal(valState.chapters['chap-01'].status, 'completed')
  assert.equal(valState.chapters['chap-01'].scrollPercent, 92)
  console.log('  ✓ PASS')

  console.log('▶ [TEST 4] Pilot isolation & markChapterCompleted...')
  markChapterCompleted('valentine', 'chap-02', {
    revision: '10',
    storage,
  })
  const kaelenState = loadPilotStoryProgress('kaelen', storage)
  assert.deepEqual(kaelenState.chapters, {})
  assert.equal(kaelenState.lastActiveChapterId, null)

  const nextForVal = getNextUnreadChapter('valentine', VALENTINE_CHAPTERS, storage)
  assert.equal(nextForVal?.id, 'chap-03')
  console.log('  ✓ PASS')

  console.log('▶ [TEST 5] Revision change handling (never assume new revision is read)...')
  const updatedRevisionChapters = VALENTINE_CHAPTERS.map((c) =>
    c.id === 'chap-01' ? { ...c, revision: '17' } : c
  )
  valState = loadPilotStoryProgress('valentine', storage)
  const effRevChanged = getEffectiveChapterProgress(
    valState.chapters['chap-01'],
    '17'
  )
  assert.equal(effRevChanged.isRevisionChanged, true)
  assert.equal(effRevChanged.effectiveStatus, 'unread')

  const nextWithRevUpdate = getNextUnreadChapter(
    'valentine',
    updatedRevisionChapters,
    storage
  )
  assert.equal(nextWithRevUpdate?.id, 'chap-01')

  // Opening the new revision starts fresh as in_progress with lastRevisionSeen='17'
  markChapterInProgress('valentine', 'chap-01', {
    scrollPercent: 10,
    revision: '17',
    storage,
  })
  valState = loadPilotStoryProgress('valentine', storage)
  assert.equal(valState.chapters['chap-01'].status, 'in_progress')
  assert.equal(valState.chapters['chap-01'].scrollPercent, 10)
  assert.equal(valState.chapters['chap-01'].lastRevisionSeen, '17')

  const continueTarget = getContinueReadingChapter(
    'valentine',
    updatedRevisionChapters,
    storage
  )
  assert.equal(continueTarget?.id, 'chap-01')

  // Unrelated localStorage key remains untouched
  assert.equal(storage.getItem('sf_v2_ui_prefs'), '{"activePilotTab":"story"}')
  console.log('  ✓ PASS')

  console.log('\nTẤT CẢ UNIT TESTS STORY PROGRESS ĐỀU PASS 100%!')
}

runTests()
