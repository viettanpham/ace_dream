# STARFRONT WORLD — FND-8 · 8.2.3 Character Roster V2

> Status: DESIGN DRAFT (audit 8 legacy visual archetypes complete; 4 new female classes pending definition / artwork). Source: `pilot_gear_v1.zip` V1 docs & assets ONLY. Do NOT import V1 runtime, V1 formulas, V1 pairing lock or V1 5-stat system. Canonical future source: FND-1 registry `Type → Class → Definition → Instance` / system definitions.

## Confirmed decisions

- Exactly 12 distinct Character/Class personas proposed for V2: 4 male, 8 female. Eight V1 pairs (fullbody + portrait) are usable references; four additional **adult** female personas require new art. Class sex / persona art is fixed per archetype, **not randomly assigned**.
- Reuse visual references without adopting V1 character gameplay or V1 conflicting biographies. All 12 will have one canonical V2 character persona definition with original biography and personality.
- `classCharacterName` identifies lore persona represented by the visual archetype (e.g. Alviss), NOT the name of the player or NPC instance. `characterClassId` identifies the gameplay Class Definition. `characterName` belongs to each independently generated/named Pilot Instance and can be freely chosen by player, subject to validation rules designed later. `pilotId` is immutable. All Player and NPC Pilot identities, exp, stats, personal GEAR and history remain independent.
- Pilot primary stats: ATK DEF AGI ENE SHD LUK. Each Class distributes **20 fixed starting class points** differently; Lv1 instance receives **10 free attribute points**, further +3 AP / +1 Skill Point per level-up. All scaling numbers/configs live in SYSTEM. Class skill affinity details belong in future sections.
- Character creation wizard: 1) choose class with fullbody/persona biography/hexagon chart; 2) assign 10 free points with interactive bars (20 class + 10 free); 3) choose a personal GEAR with compatibility suggestion; 4) review and welcome. Responsive mobile and desktop. One Pilot : one Personal GEAR instance (1:1).
- Full-body and portrait together with persona lore are mandatory per Class. `levi-portrait.webp` is INVALID / orphan, excluded from V2 asset package. Do not merge Levi into Alviss.
- V2 roster and UI are independent of V1, which remains playable until separately approved cutover.
- Four female new personas: distinct adult seductive sci-fi anime/futuristic outfits (including short pilot skirt, tailored office / commander dress, fitted flight suit), but distinctive expertise and silhouettes. Do not clone Lyra/Valentine/Selena/Kaelen visually. No generation until concept is accepted.

## V1 art inventory — acceptable pairs (reference only)

| Persona code | Gender | Fullbody | Portrait | V2 design direction (not final Class assignment) | Art assessment |
|---|---|---|---|---|---|
| `alviss` | male | `alviss-fullbody.webp` | `alviss-portrait.webp` | offensive aerial agility | keep; anime-realistic youthful black pilot suit |
| `eric` | male | `eric-fullbody.webp` | `eric-portrait.webp` | heavy assault/firepower | keep; armored muscular photoreal character |
| `marcus` | male | `marcus-fullbody.webp` | `marcus-portrait.webp` | tactical officer / attack-defense | keep; formal blue exosuit |
| `victor` | male | `victor-fullbody.webp` | `victor-portrait.webp` | heavy defense / shielding | keep; mature grey armor |
| `kaelen` | female | `kaelen-fullbody.webp` | `kaelen-portrait.webp` | stealth mobility / energy | keep concept; possible art refresh, fitted teal spy pilot suit |
| `lyra` | female | `lyra-fullbody.webp` | `lyra-portrait.webp` | agility | keep; vivid anime sci-fi, appealing benchmark |
| `selena` | female | `selena-fullbody.webp` | `selena-portrait.webp` | attack + energy | keep design, maybe harmonize lighting/anime style, red dress |
| `valentine` | female | `valentine-fullbody.webp` | `valentine-portrait.webp` | shield / energy support | keep; anime sci-fi benchmark |

Note: V1 name aliases are inconsistent (`alviss` vs `Levi Reed`, other name variants). Keep the 8 stable persona code IDs, and author fresh canonical V2 bios without importing contradictory V1 runtime identity.

## Four additional adult female persona slots (CONCEPT APPROVED; full individual assets pending)

| ID | Proposed working persona | Visual direction | Stat specialization hypothesis |
|---|---|---|---|
| C09 | Fortuna | confident casino/intelligence agent, fitted black-and-gold sci-fi office dress | LUK |
| C10 | Aria | elegant flight operations officer, tailored short pilot skirt, neon-blue accents | AGI + ENE |
| C11 | Rhea | veteran shield escort / command specialist, attractive fitted battle suit and cropped cape | DEF + SHD |
| C12 | Nova | bold versatile test pilot, streamlined fitted flight suit, silver-orange | balanced / ATK+LUK |

**All four names, personas and role directions are approved at concept level.** 20-point distributions remain subject to final approval and eventual tuning. The concept-sheet crops are previews, not full-body/portrait finals. No V1 lore or stat formula becomes V2 canon by default.

## Engineering & UI constraints

- Class and Pilot Instance data distinct; `classCharacterName` must not be overwritten by `characterName`.
- `fullbodyAssetId` and `portraitAssetId` reference verified, matching artwork, via registry. Asset mismatch in V1 is not canon in V2.
- Gallery/class catalog and creation wizard reuse definitions and chart logic, not V1 UX. Full-body high priority, bio concise, class traits prominent, six-sided attribute chart on Step 1; Step 2 uses stacked bar chart with separate class and free portions.
- Graceful rendering and responsive layout; LOW graphics mode retains all information/features and may omit animation. Preserve deterministic gameplay results across visual modes.
- V2 features are NOT to be implemented in the PLAN/DEFINE phase. AI Studio must audit actual repository and create/update persistent Vietnamese architecture feature MD, SYSTEM catalogs and bounded roadmap before implementation, and implement only one bounded phase per call later.

## Status / handoff

- 8.2.3.A roster inventory and eight valid pairs: approved.
- Art consistency review: recommendation only; no replacement images yet.
- Four female personas Fortuna/Aria/Rhea/Nova, visual directions and distinct roles: APPROVED at concept level. Current 12 x 20 class allocations: PROPOSED, pending final acceptance. Full detailed biographies: TO AUTHOR after points approved.
- 8.3.2 Reserve Pilot Lifecycle: ON HOLD until 8.2.x completed.


## 8.2.3.B — Canonical role/persona proposals and provisional base points (2026-10-21)

User-approved overall roster: 4 male / 8 female; twelve distinct main gameplay identities; shared Class Definitions for Player/NPC. Gallery and Wizard should present a concise summary first, with expandable biography, story, art collection, personality, aspirations, education/training, hometown/origin, catchphrase and lore details; all long-form prose must be newly written in Vietnamese for V2, not copied from V1. Future art variants are associated with the same persona and DO NOT create new class identities.

| ID | code / classCharacterName | Gender | Role / profession | Temperament, clothes, art direction | ATK | DEF | AGI | ENE | SHD | LUK |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|
| C01 | alviss / Alviss | Male | Offensive aerial agility | Young bold speed-lover, lightweight black pilot suit | 6 | 2 | 6 | 2 | 2 | 2 |
| C02 | eric / Eric | Male | Heavy frontal firepower | Muscular, headstrong, heavy armor | 7 | 3 | 3 | 3 | 2 | 2 |
| C03 | marcus / Marcus | Male | Offensive/defensive tactics | Disciplined officer, sleek navy military suit | 6 | 6 | 2 | 2 | 2 | 2 |
| C04 | victor / Victor | Male | Armored defense / shield holding | Experienced steadfast protector, grey heavy armor | 2 | 6 | 2 | 2 | 6 | 2 |
| C05 | kaelen / Kaelen | Female | Intelligence / opportunist evasion | Reserved, calculating, enigmatic teal-haired spy, refined fitted teal-black suit; V2 art refresh requested | 2 | 2 | 6 | 3 | 2 | 5 |
| C06 | lyra / Lyra | Female | Pure agility / evasion | Flirtatious playful confident, white-purple fitted pilot suit, silver-lavender hair | 3 | 2 | 7 | 3 | 2 | 3 |
| C07 | selena / Selena | Female | Energy artillery / combat caster | Mature proud confident, long red hair and refined red futuristic uniform dress; V2 art refresh requested | 6 | 2 | 2 | 6 | 2 | 2 |
| C08 | valentine / Valentine | Female | **Primary Medic / Rescue / Shield Support** | Gentle caring merciful healer, sexy elegant white-green futuristic medical pilot suit, mission to bring teammates home | 2 | 2 | 2 | 6 | 6 | 2 |
| C09 | fortuna / Fortuna | Female | Luck & strategic opportunism | Mature enigmatic strategist, black-gold fitted office / secretary-inspired sci-fi short skirt and stockings | 3 | 2 | 4 | 3 | 2 | 6 |
| C10 | aria / Aria | Female | Flight coordination / tactical support | Cheerful bright operations officer, blue-white fitted short uniform, blue hair | 2 | 2 | 5 | 6 | 3 | 2 |
| C11 | rhea / Rhea | Female | Dynamic defense / escort command | Assertive devoted protector, fitted black-purple armored bodysuit | 2 | 6 | 5 | 2 | 3 | 2 |
| C12 | nova / Nova | Female | Experimental assault / luck | Rebellious inventive test pilot, silver-orange form-fitting flight suit, short silver hair | 6 | 2 | 3 | 2 | 2 | 5 |

Every row totals EXACTLY 20 Class Points. 10 additional free points at Level 1 belong only to the individual Pilot Instance; 3 Attribute Points + 1 Skill Point per level gained. Values are **proposed base distributions — not yet finally locked**. Victor vs Rhea: defensive shield anchor vs moving escort; Kaelen vs Aria: stealth LUK tactics vs energy/flight coordination. Valentine's Medic role is explicitly approved, but *healing capabilities must be learned via Skill Definitions*, not automatically granted by SHD/ENE stat alone.

### Lore/profile writing deliverable (mandatory before final approval)

For EACH of 12 lore personas, compose: stable code/Class ID; canonical `classCharacterName` full name; gender (adult), apparent age; story/lore origin, home region/base, education, profession and affiliations; personality; personal dream/objective, strengths/weaknesses and philosophy; concise Wizard summary (ideally 1–3 lines) and detailed Gallery biography with optional Story panels; character quote; equipment/clothing and silhouette references; verified fullbody/portrait assets and optional future art variants; basic role and 20 Class base points; pilot-skill affinity placeholder (skill specifics in 8.5). User-created `characterName` and NPC-generated names are *separate per-instance fields* and never overwrite the lore persona. No assumption about the original V1 names/ages/biographies without review.

### Wizard/Gallery UX decisions

- Step 1: visually focused full-body image, lore `classCharacterName`, concise role, short synopsis, gender, hexagon chart of six **Class base** attributes, prev/next and class selector, responsive to phone/desktop; deep Story belongs in expandable details/Gallery.
- Step 2: independent user `characterName` input at the appropriate step before final confirmation and 10 free attribute points; show separate base/free segments in attribute bar chart, class portrait and summary.
- Step 3: personal GEAR selection (compatibility suggestions not forced), Step 4: confirmation + VSS Welcome.
- Class Gallery: prominent full-body, expandable long-form Story/Biography/Character Quotes, same six-stat chart, browsable art variants; same canonical Definition shared with Wizard.
- No implementation prompt yet; define and document only. 8.3.2 remains ON HOLD.

## 8.2.3 UI CONCEPT — APPROVED (2026-10-21)

- Approved visual source: `FND8_823_CHARACTER_SELECTION_UI_APPROVED.png` (original AI-generated concept; target composition, visual hierarchy, cinematic blue/black sci-fi HUD, not pixel-perfect implementation). Store image separately in `/STARFRONT_WORLD/` Library. The V2 design language should be carried consistently through Character Selection, Gallery and future WORLD V2 screens; do not mechanically rewrite V1 UI, but also do not modify V1 until an explicit cutover.
- Desktop concept: 12-character thumbnail roster and filters left, large selected character art center, detailed pane right, four-step wizard navigation at bottom. Responsive behavior must be designed for small screens with same information and controls; graphics LOW/MEDIUM/HIGH/AUTO do not change rules/results.
- Detail pane: **classCharacterName** (lore persona), class gender, specialty/role, flavor tags (e.g. Stealth/Evasion/Intel Gathering), short description, exactly six base stats, one or more Signature/Class Traits, canonical lore profile (origin/training/personality/aspiration), Story and Gallery tabs, and art variants (only when real verified assets exist). Placeholder concept content/art does NOT become canon automatically.
- Trait cards/chips support mouse hover **and** touch/click/focus for a tooltip/popover showing effect explanation, trigger and conditions, calculated values if grounded by SYSTEM and any applicable cap/cooldown. Accessible keyboard/focus treatment and non-hover path are mandatory. Differentiate descriptive role/flavor tags from actual gameplay Traits: flavor tags have no automatic combat modifiers.
- Wizard operates on **Class Definition** first; `characterName` of Player/NPC Pilot Instance is only created in the subsequent naming stage; traits/base stats are sourced from immutable class definition, while assigned free points/level/EXP/GEAR/history belong to unique Pilot Instance. Creation process retains agreed four steps (Class → Configure/Naming and 10 free points → GEAR → Confirmation).
- This visual concept was approved enthusiastically by the user as UI/UX direction. Use as a design reference, not an assertion that interactive React code currently exists.

## 8.2.x TRAIT FOUNDATION — NEW DESIGN AGREEMENT (2026-10-21)

- A Character Class may own **MULTIPLE** Traits; previous recommendation of exactly one Signature Trait is superseded. Treat Signature as a special classification/highlight, not a limit of one trait total.
- Traits are individually defined, data-driven independent definitions, referenced from character Class via `traitDefinitionIds`, not embedded duplicated effect logic in class or UI. Extend shared FND-1 Type → Class → Definition → Instance and canonical `system_*_data.json` as appropriate after auditing actual repo and FND dependencies. Reuse existing valid trait definitions; introduce new types/effects only when a class concept genuinely needs them. No accidental direct mutation of V1.
- Separate (a) flavor/style tags with no gameplay effect, (b) true gameplay traits and (c) learned Pilot Skills. A trait can affect one attribute or have conditional/complex effects; definitions specify trigger/event, target, numeric operation, scaling, limits, priority/stacking, cooldown/duration if applicable, as required by the combat contract. No fixed numeric trait modifiers approved yet.
- Potential trait classes: innate passive, conditionally triggered passive, signature trait; optional downsides only if balanced and approved. Each effect must obey prior approved Pilot stat semantics (ATK DEF AGI ENE SHD LUK) and Shield/Hull pipeline and Combat V2 deterministic simulation; visual quality and UI tooltips cannot change simulation/RNG.
- The player should see traits in Character Selection and Gallery and inspect each via tooltip/popover; Pilot Instance Details should show effective traits with source (Class/learned/GEAR if later applicable), no duplicate trait stacking without explicit rules.
- NEXT: define concrete candidate Traits for the 12 persona/Class roles, with clear boundaries, balanced effects and stacking rules, **one small subsection at a time**, then draft SYSTEM catalogs and full 12 lore biographies upon approval. No implementation yet. **8.3.2 remains HOLD.**

## 8.2.3 Trait catalog handoff (2026-10-21)

Approved design principle: each Class can inherit any count of modular, individually-defined Traits, **no count balancing**. Each trait represents ONE main gameplay property / buff / conditional effect, not a bundled multi-attribute package; trait count follows persona lore and expertise, not artificial parity. Tooltip on mouse hover and focus / tap on touch shows exact mechanic and condition. `PASSIVE`, `CONDITIONAL`, `SIGNATURE` classification is descriptive, not a fixed 3-slot loadout. All Trait effect evaluations consume shared FND-1 SYSTEM catalog; Player/NPC obey same mechanical rules. Proposed per-character associations and conservative combat-pipeline constraints documented in `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`; effect stats **NOT YET APPROVED**; initial trait names/associations APPROVED. Do not implement speculative stealth/escort statuses without repository audit. 8.3.2 HOLD.


## Trait design approval note — 2026-10-21

Initial 12-Class Trait roster has been approved as a modular, independent catalog (`FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`). Different Class personas may have different numbers of Traits according to story, specialization, attributes, and combat identity; do not equalize counts. Character Selection / Character Gallery display semantic icons and hover/focus/tap Trait details matching the approved sci-fi UI concept. Supporting future AdminCP add/remove/reassociation is an ENHANCEMENT PHASE, not an initial UI implementation requirement. Trait mechanics/balance constants remain subject to dedicated SYSTEM review. `classCharacterName` / Class Definition never becomes a Pilot Instance `characterName`.


## CANONICAL 8.2.3.D.1 Pipeline override (APPROVED 2026-10-21)

Pilot Class Base (20 points) → Pilot Instance Progression (10 free points Level 1, +3 free points each Level-up, derived Pilot metrics) → inherited Class Trait modifiers **within Pilot scope** → Final Effective Pilot Stats / Pilot-origin conditional modifier channels → integration with Gear / Skills / Combat V2. Conditions control whether inherited Trait contributes, not whether the Pilot owns it. Explicit additive units: +30% Evasion means +30 **percentage points** to current Pilot Evasion, e.g. 30% → 60%, not 39%; never double-apply or overwrite GEAR hardware base. Authoritative details and regression checks in `FND8_8_2_3_TRAIT_CATALOG_V2_PROPOSAL.md`, section CANONICAL OVERRIDE. Prior notes stating unapproved values or old pipeline are superseded. 8.3.2 remains HOLD.
