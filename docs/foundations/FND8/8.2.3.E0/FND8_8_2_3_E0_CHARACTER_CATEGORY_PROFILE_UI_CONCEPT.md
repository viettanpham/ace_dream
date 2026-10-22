# STARFRONT WORLD V2 — FND-8 / 8.2.3.E.0
# CHARACTER CATEGORY / PILOT PROFILE UI CONCEPT CONTRACT

**Status:** USER-APPROVED UI CONCEPT / REQUIREMENTS BASELINE (2026-10-22). Desktop + mobile concepts are both approved. This document defines the required design contract; repository implementation still requires a bounded DEFINE/PLAN audit and explicit approval of that plan before code changes.
**Scope:** Character Category / Pilot Profile only. Character Selection Wizard is a separate future scope.
**FND-8.3.2.x:** HOLD.

## 1. Approved visual references found in Library / conversation assets

1. **Desktop concept:** `Giao diện chọn nhân vật Valentine tương lai.png`
   - Library/conversation file reference ID at audit: `file_00000000c5448211822fe20d85b18282`.
   - Wide STARFRONT UI with character roster, large selected character artwork, identity/role, description, six base attributes, Traits, character information, gallery thumbnails, and navigation/selection elements.
   - Use as the approved visual direction and visual hierarchy. During E.0 implementation, isolate the Category/Profile route from the separate Character Selection Wizard flow; do not accidentally make the Category page a character-creation wizard.

2. **Mobile / phone concept (paired states):** `hồ_sơ_valentine_ánh_sáng_cuối_cùng.png`
   - Library/conversation file reference ID at audit: `file_00000000149c8211841a4d5c37b01dd4`.
   - Shows mobile profile/info state and a separate mobile character-art viewing state side-by-side. This is the approved mobile direction; mobile is not a downscaled desktop layout.

3. **Additional mobile/profile reference:** `giao_diện_chọn_nhân_vật_valentine_tương_lai.png`
   - Library/conversation file reference ID at audit: `file_00000000b928821191fb2c5005032393`.
   - Portrait-oriented profile layout with OVERVIEW / STORY / GEAR COMPAT / GALLERY, character identity, quote, short description, base stats, Traits, character info, gallery and separate information/art viewing controls.

4. **Do not confuse with the separate Wizard reference:** `FND8_823_CHARACTER_SELECTION_UI_APPROVED.png` and `a_wide_high_detail_ui_concept_artwork_screenshot.png` show the Character Selection Wizard / class selection flow. They may share visual language, but are not substitutes for the approved Category/Profile mobile reference.

## 2. User-approved requirements to preserve

- Build desktop and mobile support together from the first implementation phase.
- Start with Valentine as the reference character because her profile data and approved artwork set are comparatively complete.
- Keep Character Category / Profile distinct from Character Selection Wizard / new character creation.
- Category/Profile tabs: `OVERVIEW`, `STORY`, `GEAR COMPAT`, `GALLERY`.
- Keep `shortDescription` and `characterQuote` as two separate text blocks; do not merge them.
- Overview can display role/specialty tags, six Class base attributes (total 20), Class Traits, compact character facts, and a profile artwork preview.
- Gallery uses only real, verified, registered assets. Reuse the approved manifest and existing filenames; do not invent filenames or assume Library assets are already copied into `public/images/`.
- Story supports chapter content and optional registered art references. A planned story image is metadata only until a real approved file exists; no broken image paths.
- GEAR COMPAT is its own tab; do not invent a new GEAR gameplay system in this UI phase.
- Large artwork viewer should support the existing V1 viewer capabilities if confirmed by repository audit: fullscreen, zoom/pan, touch gestures and desktop/mobile navigation.
- The desktop concept included **two controls/toggles on either side of the central character/background presentation**, allowing the player to switch between two background/showcase versions while viewing the character. Preserve this feature in desktop UI. On mobile, expose equivalent controls in a compact, touch-friendly form in the artwork viewing state.
- Responsive behavior must be deliberately designed: desktop multi-column composition; mobile stacked profile and a distinct artwork viewing state. Avoid shrinking the desktop layout into a narrow viewport.
- Use appropriate empty/loading/error/placeholder states. Missing artwork must never block the UI.

## 3. Data contract and canon boundaries

- `classCharacterName` is the canonical lore/persona identity of a Class.
- `characterName` belongs to a specific player/NPC Pilot Instance and must not be overwritten with the lore persona's identity or biography.
- Character Profile, Story, Class Definition, Trait references and artwork manifests remain separate data responsibilities.
- Trait effects and class base attributes must come from the canonical FND-1/FND-8 definitions; never derive them from concept-image text or artwork metadata.
- Valentine source: `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`, her approved artwork register and `VALENTINE_V2_APPROVED_ASSET_MANIFEST.json` (verify exact current names/paths in repository before implementation).
- Story status: Chapters 01–04 approved; Chapters 05–06 provisionally approved; Chapters 07–10 HOLD. Do not display HOLD chapters as released story content.

## 4. E.0 implementation boundary

**Included after explicit IMPLEMENT approval:**
- Audit existing routes/components/design tokens and current image import paths.
- Build the Category/Profile shell with desktop and mobile layouts.
- Connect Valentine profile data and verified artwork manifest.
- Implement the four tabs, art viewer modes, two background toggles, and robust placeholders.
- Verify responsive behavior and run bounded tests/build.

**Excluded:**
- Character Selection Wizard and player character creation.
- Writing or revising long-form Story chapters.
- Generating artwork or changing approved artwork.
- Rebalancing Traits/stats, changing FND architecture, or starting 8.3.2.x.

## 5. DEFINE/PLAN deliverables before implementation

1. Confirm exact concept files exist in the repository/Library and retain these references.
2. Audit current route/component/data/asset conventions.
3. Propose the Category/Profile route and component plan, explicitly separate from the Wizard.
4. Map Valentine fields/assets to UI and identify unavailable fields/assets without inventing values.
5. Define desktop and mobile acceptance criteria, including both background toggles and the mobile art-view state.
6. Create/update the E.0 feature MD and handoff/checkpoint, then stop and wait for user approval before code changes.


## 6. UI rebuild policy — effective from E.0 (user-confirmed 2026-10-22)

### 6.1 Concept-first is mandatory

- Workflow is **approved UI concept/preview → repository audit + bounded plan → user approves plan → implementation → real-data testing → user feedback → targeted correction**.
- An approved preview is the minimum required visual and behavioral reference, not a vague inspiration. Feature MDs must link to the exact approved concept files and translate them into explicit layout, content hierarchy, interactions, responsive states, and acceptance criteria.
- AI Studio must not invent a different layout, add arbitrary panels/decoration/information density, remove approved controls, or substitute an unapproved design without asking the user first.
- Do not use a concept screenshot as a static page background. Rebuild it as real, responsive UI components connected to real data/assets.

### 6.2 New UI means a clean V2 implementation

- For E.0, create a clean, isolated Category/Profile V2 page/component and its own responsive styles. Do **not** patch, cosmetically repair, wrap, or inherit the cluttered legacy screen/CSS as the foundation of the new UI.
- Audit the legacy implementation only to understand routes, reusable data access, proven viewer behavior, and integration constraints. Reuse only the parts explicitly verified as suitable, such as canonical data, asset manifests, domain logic, or an independently reusable viewer utility.
- Legacy UI components/styles are considered **legacy reference only** for this new surface. Keep them isolated and unchanged unless a separate, explicit cutover/removal task is approved. Do not delete shared files or break existing routes as an unreviewed side effect.
- This is not a requirement to discard canonical data, approved artwork, SYSTEM registries, or useful domain services. **Rebuild the UI; reuse verified data/assets, not the old visual implementation.**

### 6.3 Desktop and mobile are co-equal in the first implementation

- Desktop and mobile are both required in the **same first E.0 implementation phase**. No desktop-only delivery followed by a later mobile retrofit.
- Implement deliberate desktop composition and deliberate mobile composition according to their respective approved references. Mobile is not simply a compressed desktop layout.
- The two background/showcase controls must work in both modes. On desktop they flank/relate to the central character presentation as shown in the approved concept; on mobile they must remain discoverable, touch-friendly and usable in the artwork-view state.
- Test at least one desktop viewport and one phone-sized viewport before marking the bounded phase complete. Capture or provide actual rendered screenshots when the environment supports it; never claim a screenshot/test that was not produced.

### 6.4 Valentine is the real-data pilot

- Use the actual Valentine profile/story data and verified artwork manifest/register as the first end-to-end integration case.
- Audit the repository for the exact source schema, canonical file names, asset URLs and route conventions before coding. Do not assume that files in ChatGPT Library automatically exist in the app's `public/` directory.
- Do not fabricate missing lore, Traits, statistics, chapters, image URLs or GEAR compatibility. Missing or unavailable data must use an explicit, visually consistent empty/placeholder state and be reported in the plan/test report.
- Preserve the content states: Story Chapters 01–04 APPROVED; 05–06 PROVISIONAL; 07–10 HOLD. HOLD content must not be presented as released content.

### 6.5 User-led test and correction loop

- The first goal is a usable test build for the approved Category/Profile concept, not a claim of final polish.
- When the user reports a defect, record: mode/viewport, steps to reproduce, expected result, actual result, screenshot/log if supplied, likely affected component, and regression checks.
- Fix the smallest bounded issue first. Update the E.0 Feature MD, defect/checkpoint notes and acceptance criteria when the new finding reveals a missing requirement or changes an approved decision.
- Do not silently change already approved layout/content hierarchy. If the fix requires a design change, present the revised preview/decision for user approval before implementing that change.
- Every correction must be checked in both desktop and mobile, plus relevant targeted tests/build. Keep a concise defect log and mark each item OPEN / FIXED / VERIFIED; do not mark FIXED as VERIFIED without a real check.

### 6.6 Mandatory DEFINE/PLAN output before code

The next AI Studio invocation must be `DEFINE / PLAN ONLY`, in Vietnamese, and must:
1. Inspect the actual repository, branch/status, app entry points, routes, UI components, CSS/design tokens, dependencies, existing tests, data registries, Valentine profile/story files, and exact asset imports.
2. Identify legacy UI to isolate and the exact reusable data/assets/services. Do not edit or delete source code during this audit.
3. Produce/update the E.0 Feature MD and implementation plan with bounded phases; Phase E.0-IMPLEMENT-1 must deliver the first integrated desktop + mobile testable UI together.
4. Define acceptance criteria for concept fidelity, both background/showcase controls, the four tabs, real Valentine data/assets, missing/loading/error states, responsive behavior, accessibility/keyboard/touch behavior, and build/test checks.
5. List files planned for create/edit and any risky shared dependencies. Keep changes isolated from FND-8.3.2.x (HOLD), gameplay balancing, Character Selection Wizard, and unrelated legacy screens.
6. Update progress/checkpoint/handoff documents, then STOP and wait for explicit user approval. No implementation, no automatic full-FND run, and no unrequested refactor.

After the user approves the plan, use a separate `IMPLEMENT / RESUME ONE PHASE` prompt. Implement only the explicitly approved bounded phase and update the Feature MD, tests/results, progress and handoff before stopping.

## 7. Current decision checkpoint — 2026-10-22

- **APPROVED:** Build the new Category/Profile UI from the approved concept; desktop + mobile together from the first implementation phase; Valentine is the first real-data test character; old cluttered UI must not be used as the new UI foundation.
- **APPROVED:** User will test the initial build and report concrete defects; requirements/checkpoints are updated as needed and fixes are made in bounded iterations.
- **NOT YET APPROVED:** Any specific implementation plan that has not been audited against the actual repository. The next step is DEFINE/PLAN ONLY, then user review, then bounded implementation.
- **OUT OF SCOPE:** Character Selection Wizard, broad legacy deletion/cutover, story writing, artwork generation, gameplay/stat/trait changes, and FND-8.3.2.x.
