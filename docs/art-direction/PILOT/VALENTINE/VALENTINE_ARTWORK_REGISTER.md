# Valentine — Artwork Register (STARFRONT V2.0)

**30 approved images:** 9 original + 21 additional.

Canonical URL root: `/images/` (files under `public/images/`).

| # | Filename | Type | Purpose |
|---:|---|---|---|
| 01 | `valentine-activity-001.webp` | base | Selection / Details / Gallery |
| 02 | `valentine-casual.webp` | base | Selection / Details / Gallery |
| 03 | `valentine-closeup.webp` | base | Selection / Details / Gallery |
| 04 | `valentine-combat.webp` | base | Selection / Details / Gallery |
| 05 | `valentine-event-001.webp` | base | Selection / Details / Gallery |
| 06 | `valentine-fullbody.webp` | base | Selection / Details / Gallery |
| 07 | `valentine-portrait.webp` | base | Selection / Details / Gallery |
| 08 | `valentine-story-001.webp` | base | Selection / Details / Gallery |
| 09 | `valentine-uniform-001.webp` | base | Selection / Details / Gallery |
| 10 | `valentine-outfit-001.webp` | flight-suit | Cockpit; seated pilot |
| 11 | `valentine-outfit-002.webp` | evening | Teal evening gown |
| 12 | `valentine-outfit-003.webp` | evening | Red/black full-body gala, outstretched hand (re-rendered; not duplicate of #013) |
| 13 | `valentine-outfit-004.webp` | evening | White gala look |
| 14 | `valentine-outfit-005.webp` | casual | City stroll |
| 15 | `valentine-outfit-006.webp` | casual | Afternoon tea |
| 16 | `valentine-outfit-007.webp` | casual | Flower street |
| 17 | `valentine-outfit-008.webp` | flight-suit | Pilot near hangar |
| 18 | `valentine-outfit-009.webp` | flight-suit | Pilot seated in hangar |
| 19 | `valentine-outfit-010.webp` | night-shift | Clinical shift |
| 20 | `valentine-outfit-011.webp` | evening | Grand gala |
| 21 | `valentine-outfit-012.webp` | evening | Gala staircase |
| 22 | `valentine-outfit-013.webp` | evening | Ballroom |
| 23 | `valentine-outfit-014.webp` | casual | Spring city |
| 24 | `valentine-outfit-015.webp` | night-shift | Doctor at hospital |
| 25 | `valentine-outfit-016.webp` | academy | Academy uniform standing, revised image |
| 26 | `valentine-outfit-017.webp` | academy | Academy uniform seated, revised image |
| 27 | `valentine-outfit-018.webp` | academy | Academy formal walk |
| 28 | `valentine-outfit-019.webp` | night-shift | Medical duty seated |
| 29 | `valentine-outfit-020.webp` | homewear | Homewear in room |
| 30 | `valentine-outfit-021.webp` | homewear | New approved at-home night look |

## Story state and references

- Chapter 01–04: approved. Chapter 05–06: provisionally approved. Chapter 07–10: HOLD.
- Story 01: `valentine-story-001.webp`, `valentine-closeup.webp`.
- Story 02: `valentine-uniform-001.webp`.
- Story 03: `valentine-activity-001.webp`.
- Story 04: `valentine-casual.webp`.
- Chapter 05–06 artwork pending; can reuse Gallery assets.
- Do not embed technical node IDs in prose; VSS capital is a peaceful, affluent protected core city.
- `valentine_assets_manifest.json` is the machine-readable gallery/asset definition.
- Chapter full text is not bundled into this asset package.

## Integration

Unzip so each image ends at `<project>/public/images/<filename>.webp`. The browser URL is `/images/<filename>.webp`. Use the manifest for gallery ordering and Story image references.

## Latest change — 2026-10-22

- `valentine-outfit-003.webp`: replaced with newly approved red/black gala full-body artwork.
- `valentine-outfit-013.webp`: retained unchanged (seated burgundy evening look).
- All 30 filenames remain stable. In React: `/images/valentine-outfit-003.webp`. If an old image appears, invalidate the browser or image cache.
