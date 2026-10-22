# STARFRONT WORLD V2 — CHARACTER DATA / UI / STORY HANDOFF CONTRACT

**Scope:** FND-8 / 8.2.3.x DEFINE/PLAN. **FND-8.3.2.x HOLD.** This document coordinates game Class data with separate art/story chats. No implementation authorization.

## Approved UI concepts (not proof of shipped code)
- Character Selection Wizard (4 steps), distinct from Character Category/Details screen.
- Selection: 12-class roster/thumbnails, large fullbody, summary, quote, 6-point chart for six Pilot stats, Class Traits and View Details / Choose Class. Step 2 naming & allocate 10 free points; Step 3 Personal GEAR; Step 4 confirmation.
- Category/Details: OVERVIEW, STORY, GEAR COMPAT, GALLERY; responsive desktop/mobile; details and art view have reasonable empty/loading/fallback states.
- UI Definition must remain distinct from Pilot Instance data: `classCharacterName` lore identity vs `characterName` per player/NPC Pilot. 20-point class base attributes; trait IDs reference SYSTEM and use canonical D.1 pipeline; do not duplicate gameplay numbers in artwork metadata.

## Source of truth / proposed data files (NOT YET IMPLEMENTED)
- `system_character_class_data.json` / canonical FND-1 class catalog (final names depend repo audit): 12 Class/persona records, `classId`, base stats, `traitDefinitionIds`, role, UI refs.
- Per-Class `CHARACTER_PROFILE_DEFINITION.md` and machine-readable `character_profile_data.json`: class lore name, adult age, homeland, academy/training, personality, shortDescription, quote, biography, Story chapter references, review status. **Schema names must be confirmed against actual repo**.
- Per-Class `*_ART_DEFINITION.md`: visual anchor/style consistency/approved wardrobe/shot briefs.
- Per-Class `*_ARTWORK_REGISTER.md`: immutable approved filenames, category, batch, approval history; **do not use to invent game lore or gameplay traits**.
- Per-Class `<class>_assets_manifest.json`: verified `assetId`, relative browser URL and approval, intended UI/gallery/story use, width/height; normalize differing existing manifest schemas in the import adapter/plan rather than blindly rewriting author files.
- Shared `pilot_artwork_status.json`: central derived summary + source import checks. This is an inventory, not a data gameplay registry.

## Artwork state policy (user approved)
`>=20` approved independent assets = `COMPLETE_ART`. `10-19` = `PROCESSING_USABLE`; `1-9` = `PROCESSING_LIMITED`; `0` = `PLACEHOLDER_ONLY`. Five core image slots are `fullbody`, `portrait`, `combat`, `closeup`, `activity`, and must be tracked individually even if total count reaches 20.

## Story placeholders / chapter schema guidance
- `storyChapterId`, `chapterNumber`, `title`, `contentStatus` (`DRAFT`/`REVIEW`/`APPROVED`/`PROVISIONAL`/`HOLD`), optional `assetRefs[]` with assetId, `placement`, optional prompt/scene brief and `assetStatus` (`PLANNED`/`READY`).
- Story art is optional, typically 0–3 images per chapter; registered READY assets may come from the Gallery. Never call a placeholder a physical image and never render a broken path when not READY.
- Story chat only modifies owned story text/briefs after user review; Art chat only modifies owned art assets/manifest. Design chat maintains shared schema/status, keeping previously approved sections unchanged.
- Valentine chapters 01–04 approved, 05–06 provisional, 07–10 HOLD. Other characters' lore must use verified WORLD canon, no guessed locations or overwritten biographies.

## Checkpoints needed for a handoff
1. Which Class, scope, owner, batch/chapter and next action.
2. Current APPROVED/PROVISIONAL/REVIEW/HOLD values, with actual Library paths.
3. Existing `*_ART_DEFINITION.md`, Register, manifest, ZIP, and Profile/Story MD availability.
4. Required 5 core image slots present/absent and extra 15 coverage; planned event/story art only metadata until generated.
5. Changes from the previous checkpoint, any user-approved changes and unresolved decisions.
6. No silent source import/implementation; read repository and use one approved DEFINE/PLAN then one bounded IMPLEMENT phase per explicit user request.

## Current 8.2.3 work status
UI concepts approved; gameplay/class traits and canonical pipeline documented in FND8 materials; character-specific Profile/Story schema and 12-persona authored data remain **IN PROCESS**. Artwork production is parallel and does not block constructing profiles, class definitions or UI skeletons with proper placeholders.


## UI/UX CONCEPT-FIRST REBUILD POLICY — USER APPROVED 2026-10-22

- For new V2 UI surfaces, an explicitly user-approved concept/preview is the minimum required visual and behavioral contract. Workflow: **preview approval → DEFINE/PLAN repository audit → user approves plan → one bounded IMPLEMENT phase → real-data test → user feedback → targeted fix**.
- Build new UI components/layout/styles cleanly and isolate them from legacy UI. Do not patch or inherit cluttered V1/legacy UI as the foundation of a new V2 surface. Audit old code only for verified integration constraints and reusable data/assets/domain logic. Preserve shared legacy files unless a separate cutover/removal task is explicitly approved.
- Desktop and mobile are co-equal deliverables when stated in the approved concept; implement and test both in the first bounded UI phase, not as separate desktop-first/mobile-later work.
- Use real registered profile/story data and verified asset manifests. Never invent missing fields or assume Library files are already deployed into the app repository.
- User-reported defects trigger a bounded defect log, requirement/acceptance-criteria update where needed, a targeted fix, and regression checks in both modes. Do not silently alter an approved design; request approval when the fix changes the concept.
- All AI Studio prompts/reports stay in Vietnamese. DEFINE/PLAN ONLY does not change code. IMPLEMENT is one explicitly approved bounded phase per invocation, followed by tests/build results and updated progress/handoff. Do not claim tests/screenshots were run unless actual evidence exists.
- E.0 source of truth: `FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`; implementation planning must be audited against the current repository. FND-8.3.2.x remains HOLD.
