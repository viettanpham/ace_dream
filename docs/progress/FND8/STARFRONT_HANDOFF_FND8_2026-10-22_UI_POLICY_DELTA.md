# STARFRONT WORLD — FND-8 HANDOFF DELTA (2026-10-22)

**Purpose:** Latest UI/UX policy and immediate E.0 next action. Read with `STARFRONT_HANDOFF_FND8_2026-10-20.md`; this dated delta supersedes older status wording where it conflicts on current FND-8 progress and E.0 UI workflow.

## Current work focus
- Active design scope: FND-8 / 8.2.3.x.
- Immediate UI work item: `8.2.3.E.0 — Character Category / Pilot Profile UI Foundation`.
- Desktop and mobile concept references are approved by the user.
- First integrated UI test character: Valentine, using actual profile/story data and verified artwork assets.
- FND-8.3.2.x remains HOLD.

## Non-negotiable UI rule from E.0 onward
**Approved preview first; clean implementation second.** Do not allow AI Studio to freely invent UI after receiving a vague feature description. The approved concept is the minimum layout/content/behavior contract.

- New V2 UI must be rebuilt as clean, isolated components/layout/styles. Do not patch or inherit cluttered legacy UI as the new UI foundation.
- Audit legacy code only for verified routes/integration, data access, registries, assets and reusable domain behavior. Keep legacy screens/shared code untouched and isolated unless a separate cutover/removal task is explicitly approved.
- Implement desktop + mobile in the same first bounded phase, each matching its own approved concept. Never defer mobile as a later retrofit.
- Use actual registered Valentine data/assets; do not fabricate fields or assume Library files already exist in the repository.
- User tests the real build and reports issues. Update requirements/checkpoints when needed, fix the bounded issue, and re-test both modes. Design changes require approval before code.

## Required next step
1. AI Studio: `DEFINE / PLAN ONLY`, Vietnamese. Audit actual repository and write/update the E.0 Feature MD, architecture/UI reference, exact source mapping, phase plan, risks, acceptance criteria and checkpoint/handoff. No code changes.
2. Stop and wait for user review/approval.
3. Only after approval: `IMPLEMENT / RESUME ONE PHASE`, restricted to the approved bounded phase. First implementation must deliver a testable desktop + mobile Category/Profile together.

## Files to read first
- `FND8_8_2_3_E0_CHARACTER_CATEGORY_PROFILE_UI_CONCEPT.md`
- `FND8_8_2_3_E0_UI_REBUILD_CHECKPOINT_2026-10-22.md`
- `PILOT_CHARACTER_DATA_UI_STORY_HANDOFF.md`
- `FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
- Valentine approved artwork register and canonical asset manifest; verify exact current names/paths in the repo.

## E.0 excludes
Character Selection Wizard, broad legacy deletion/cutover, long-form Story writing, artwork generation, gameplay balancing, and FND-8.3.2.x.
