# STARFRONT WORLD V2 — FND-8 / 8.2.3 · Character Trait Catalog (DESIGN PROPOSAL)

> 2026-10-21 · **Initial 12-Class Trait roster APPROVED (names, intent, mappings); numerical gameplay balance NOT YET APPROVED.** 8.3.2 HOLD. No implementation. V1 solely referential. All 12 personas / gender / main combat professions are approved; the numerical 20-point base matrix is proposed and awaits final user lock.

## Locked design rules

- Lore persona and Class Definition (`classCharacterName`, `characterClassId`) separate from every Pilot Instance (`characterName`, immutable `pilotId`), whether Player or NPC.
- Each Trait (`traitId`) is a modular SYSTEM Definition with **one primary stat/effect**; a Class references any number of applicable Trait IDs without equal-count balancing. Each Trait can be reused by other Classes where lore fits. No assumption that one Trait must be unique; 'Signature' is an editorial identity marker, not a mandatory slot.
- Distinguish Trait classification (`PASSIVE`, `CONDITIONAL`, `SIGNATURE`) from explicit effect schema; Signature may behave passively/conditionally. No automatic grant of a `Skill` or new combat action solely because of a Trait name.
- Each Definition stores `traitId`, localized label, short/full tooltip, lore rationale, effect target and method, applicability filters, trigger/condition, scope, duration, cooldown, stacking, priority, configuration references, potential state requirements, and test/validation references.
- Mechanics must use FND-1 SYSTEM Registry / WORLD Combat V2 canonical pipelines and cannot alter gameplay outcomes by LOW/MEDIUM/HIGH graphics, UI framerate or batch grouping. No individual JS timers; Game-Time/Battle-Time standardized.
- **Hover/focus/click/tap tooltip** details explain what Trait does, where it works, what conditions it needs, and actual effective numbers when known. Keep tags (Stealth, Medic, Evasion, etc.) purely descriptive; only Trait Definition applies a gameplay effect.
- All percentages/magnitudes/cooldowns below are intentionally **unset** until SYSTEM balancing. Traits never grant player bonus on *top of class* twice when the Class instance is initialized. Pilot DEF is pre-shield, SHD Deflection requires nonzero shield, AGI changes evasion chance not maximum GEAR speed. LUK Lucky Buff is action-scoped; trait-based chance changes must explicitly integrate without rolling bonus luck independently.
- Caution: NPC/Player share exactly same trait mechanics, subject to eligibility; no hidden Player-only trait buffs.

## Proposed class-trait association (ONE primary effect per Trait)

| Character | Trait ID | Public-facing name | Type | One effect (implementation needs system definitions) | Trigger / restrictions |
|---|---|---|---|---|---|
| Alviss | `pilot_trait_aerial_precision` | Ưu Thế Không Chiến | PASSIVE | +weapon attack precision/Accuracy | Eligible aerial weapon actions; countered by target avoidance |
| Alviss | `pilot_trait_evasive_entry` | Đột Kích Cơ Động | CONDITIONAL | +evasion chance | First eligible enemy attack after pilot initiates engagement; finite duration |
| Eric | `pilot_trait_siege_pressure` | Áp Lực Pháo Kích | PASSIVE | +damage with heavy ordnance | Only supported heavy-weapon category |
| Eric | `pilot_trait_armor_piercer` | Đầu Đạn Xuyên Giáp | CONDITIONAL | +GEAR Armor penetration | Direct weapon hit with qualifying ordnance, affects Armor stage only |
| Marcus | `pilot_trait_fire_discipline` | Kỷ Luật Hỏa Lực | PASSIVE | +Accuracy | Standard weapon attack; scoped to this pilot |
| Marcus | `pilot_trait_defensive_read` | Đọc Thế Trận | CONDITIONAL | +Pilot DEF mitigation | Against marked / observed eligible threats, at pre-Shield stage |
| Marcus | `pilot_trait_command_focus` | Mệnh Lệnh Rõ Ràng | SIGNATURE | +effectiveness of authorized tactical commands | Only where commander authority/order operation has real eligibility, never fabricate permissions |
| Victor | `pilot_trait_shield_anchor` | Mỏ Neo Phòng Tuyến | PASSIVE | +max GEAR Shield | Only in eligible personal GEAR; not GEAR Armor or Hull |
| Victor | `pilot_trait_armor_resilience` | Giáp Tuyến Cuối | CONDITIONAL | +Armor damage mitigation | Only overflow damage to GEAR Armor; not pre-shield defense |
| Kaelen | `pilot_trait_shadow_approach` | Tiếp Cận Trong Bóng Tối | CONDITIONAL | +evasion chance | While verified stealth/hidden state applies (if Combat V2 supports it) |
| Kaelen | `pilot_trait_intelligence_edge` | Phân Tích Sơ Hở | CONDITIONAL | +weapon Accuracy | Against target with a valid detected/exposed weakness flag; no free status creation |
| Kaelen | `pilot_trait_operational_instinct` | Trực Giác Đặc Vụ | SIGNATURE | +LUK-trigger effectiveness for existing Lucky Buff | Action-scoped only; integrates original LUK path (no second lucky proc) |
| Lyra | `pilot_trait_freeflight` | Cánh Bay Tự Do | PASSIVE | +evasion chance | Pilot AGI evade pipeline; not GEAR max speed |
| Lyra | `pilot_trait_recovery_maneuver` | Phản Xạ Đổi Hướng | CONDITIONAL | +evasion chance | When attacked after a successful pilot evade; capped window |
| Selena | `pilot_trait_energy_focus` | Hội Tụ Năng Lượng | PASSIVE | +damage of eligible energy weapons | Energy weapons only |
| Selena | `pilot_trait_resonant_cast` | Cộng Hưởng Năng Lượng | CONDITIONAL | -SP Energy cost of energy-based skills | Valid skill activation, cost floor config |
| Valentine | `pilot_trait_field_medic` | Bàn Tay Cứu Hộ | PASSIVE | +effectiveness of existing legitimate heal/repair/rescue Skills | Never creates free healing action or guaranteed rescue |
| Valentine | `pilot_trait_safeguard` | Mái Khiên Nhân Ái | PASSIVE | +Shield restore amount for supported ally-support skills | Only skills that already restore Shield; not Hull heal |
| Fortuna | `pilot_trait_calculated_chance` | May Mắn Có Tính Toán | SIGNATURE | +effective strength of existing Lucky Buff | Original Action-scoped LUK only; no extra buff proc |
| Fortuna | `pilot_trait_fortunate_timing` | Thời Cơ Vàng | CONDITIONAL | +Lucky Buff trigger probability | Same existing one-buff-per-action system, explicit cap |
| Aria | `pilot_trait_power_economy` | Phân Phối Năng Lượng | PASSIVE | -SP Energy skill activation cost | Applies cost floor, not Skill Points |
| Aria | `pilot_trait_tactical_recovery` | Nhịp Điều Phối | PASSIVE | +SP Energy restored at global Battle-Time interval | Global scheduler; no extra timer |
| Rhea | `pilot_trait_escort_guard` | Đội Hình Hộ Tống | CONDITIONAL | +Pilot DEF effectiveness | During supported valid escort/guard mission status, scoped to Rhea |
| Rhea | `pilot_trait_reactive_dodge` | Né Tránh Bảo Vệ | CONDITIONAL | +evasion chance | During protecting eligible ally, only if the actual combat state supports escort; no forced interception action |
| Nova | `pilot_trait_testflight_strike` | Đột Phá Thử Nghiệm | CONDITIONAL | +weapon damage | Only against combat action meeting an explicit supported test/overcharge state; status must actually exist |
| Nova | `pilot_trait_highrisk_instinct` | Bản Năng Mạo Hiểm | PASSIVE | +existing Lucky Buff effective magnitude | Existing LUK action scope; do not add proc/buff |

**Counts are examples, not a balance rule:** Alviss 2, Eric 2, Marcus 3, Victor 2, Kaelen 3, Lyra 2, Selena 2, Valentine 2, Fortuna 2, Aria 2, Rhea 2, Nova 2. Never add filler just to match counts. No numeric bonuses approved yet.

## Review points

1. Some traits reference stealth, exposed, observed, escort or overcharge flags. If Combat V2 does not provide those canonical statuses, **do not implement invented effects**. Either redefine their trigger to a supported action or defer the trait with visible catalog status (`planned/unsupported`) after architecture audit.
2. Trait name vs mechanic must stay honest: `field_medic` improves allowed recovery action, does **not** heal by itself; defending allies is not automatically damage redirection. Shield mitigation cannot bypass damage pipeline.
3. Distinguish additive vs multiplicative modifiers, effect stacking, application order, caps, identical effect collisions, and source trace output BEFORE implementing. Prevent unlimited buff chains.
4. Character Gallery displays lore, individual Trait chips and detail tooltips. Player/NPC Pilot detail also displays inherited Class Traits without editable/duplicate mutable trait copies.
5. Keep approved character-selection concept image `/STARFRONT_WORLD/FND8_823_CHARACTER_SELECTION_UI_APPROVED.png`; implement only under later user-authorized AI Studio IMPLEMENT phase.

## Follow-up

User to review **the identity and meaning of the Trait list first**, then SYSTEM effect magnitudes, grouping and mechanics. Full 12-persona long biographies later. 8.3.2 ON HOLD until 8.2.x closed.


## Approval update — 2026-10-21 (Trait roster & UI)

**APPROVED BY USER:** The initial set of Trait names, meanings, and Class associations in the table above is the V2 baseline. Different Classes are allowed different numbers of Traits; do not add filler Traits to equalize the counts. A Trait is one independent effect/buff/attribute modifier, assembled modularly via `traitId` references. Class lore and specialization determine associations.

**Trait icon & UX:** Distinct meaningful icons; clearly communicate active/triggered, passive, or condition-based behavior. 'Signature' describes lore/identity, not a separate mutually exclusive execution type. On desktop provide hover and keyboard-focus detail; on mobile provide tap-to-open detail. Tooltip displays source Class, exact effect target, trigger, duration/stack rule and numbers when defined, with disabled/unavailable state if prerequisite gameplay mechanics are not supported. Follow the approved `FND8_823_CHARACTER_SELECTION_UI_APPROVED.png` concept.

**Future enhancement, NOT part of initial foundation implementation:** AdminCP can add/remove Trait Definitions and change Class-to-Trait associations, with schema validation, compatibility/referential checks and policy for existing Pilot Instances; game should be data-driven from the outset without requiring an AdminCP editor in V1 launch. No dynamic in-combat mutation of live Class/Trait application without explicit transactional rules.

**Still pending:** exact buff magnitudes, chance, cooldowns, stacking and state/trigger compatibility audit; later full Biography/Story catalog and artwork variants. Do not claim final balance approved. Continue 8.2.3 and hold 8.3.2.

## 8.2.3.D.1 — Trait Modifier Pipeline (APPROVED — 2026-10-21)

- Trait là đặc tính cố hữu của Character Class; không phải buff tiêu hao hoặc skill chủ động cần kích hoạt. Pilot Instance thừa hưởng class trait thông qua Definition refs; level-up không tự scale trait value.
- System pipeline: Resolve Pilot/GEAR base & existing modifiers → validate Trait ownership/eligibility → apply each trait as a single-target typed modifier at its declared stage → enforce stacking, clamping, rounding → execute Combat V2 canonical calculation. Do not modify underlying GEAR hardware base values.
- Canonical modifiers are centrally versioned SYSTEM definitions (subject to FND-1 audit; e.g. `system_trait_data.json`); Class definitions reference only `traitId`. AdminCP mutation is deferred to Enhancement Phase; data-driven defaults and validation in initial V2.
- Relative percent and percentage point modifiers are separate types, e.g. evade 10% +3 pp = 13%, not 10.3%.
- Centralized stacking policy, caps and rounding order. No guaranteed evasion, bypassing shields/armor pipeline, duplicate Lucky Buffs per Action, or render-quality-dependent outcomes.
- APPROVED prototype defaults: `victor.fortress_anchor` +8% current GEAR Max Shield (passive); `lyra.free_wings` +3 percentage points Evasion Chance (passive, capped by global Evasion); `selena.energy_focus` +6% eligible Energy Weapon Damage (passive). These are config baseline, not benchmarked balance.
- Trait ownership is fixed for the class in initial V2. Conditional traits have persistent ownership but activate their effect only under declared combat predicates; that is not an activatable Skill.

## 8.2.3.D.2 — Conditional Trait Defaults (APPROVED; defaults revised — 2026-10-21)

- Kaelen `shadow_approach`: if preexisting canonical STEALTH/CONCEALED status exists and valid, +30 percentage points Evasion while status is active; no free stealth creation. If predicate unsupported, trait should be deferred/disabled until supported, not silently approximated.
- Marcus `battlefield_read`: when incoming attack is marked by a supported canonical tactical threat/defense-order predicate, +50% relative effectiveness of actual Pilot DEF damage mitigation for that attack only. Requires audit of existing order tags; no invented status.
- Rhea `escort_formation`: when assigned a valid protect/escort order, +50% relative effectiveness of actual Pilot DEF damage mitigation, scoped to attacks applicable to the order. No free defensive shielding to allies; depends on WORLD/Combat order semantics.
- Nova `experimental_breakthrough`: when a supported existing overcharge/experimental-use condition is valid, +100% eligible damage for that Action; no new resource/status introduced by the trait.
- User APPROVED the four **numeric test defaults**. Trigger predicates remain conditional on a verified Combat V2 status/order schema; if absent, label unavailable/deferred rather than inventing new mechanics. All values are static class-level initial defaults, configurable centrally, not tier-scaled.
- Important math: +50% **relative effect of Pilot DEF mitigation**, not +50 percentage points final reduction; e.g. if Pilot DEF naturally mitigates 20% incoming pre-Shield damage, this trait changes that mitigation amount to 30% (subject to central caps). +30 pp Evasion is clamped below guaranteed evasion, accounting for counters/accuracy. +100% (2x original eligible damage before other modifiers) is scoped to qualifying Action damage, not a global buff or permanent damage multiplier.
- High default magnitude is intentional because trigger is conditional; benchmark and balance later, without time-based stat drift.
- Future Trait Tier/advanced-course proposal: **defer**. Prefer attaching additional independent Traits after later approval over tier-scaling an existing Trait, consistent with modular data architecture.


### Revision note (supersedes earlier D.2 defaults)

The user explicitly revised all four conditional trait magnitude baselines. The former +10 pp / +30% / +30% / +40% are **obsolete**, NOT active defaults. New static starter defaults: Kaelen +30 **percentage points** Evasion (interpretation of “30% Evasion” as modifying former +2 pp proposal; document the unit explicitly); Marcus and Rhea +50% **relative** effectiveness of Pilot DEF mitigation under respective supported conditions; Nova +100% **relative Action damage** (double eligible base Action damage in the trait's phase). Do not apply these effects constantly: eligibility is resolved for each relevant Action/defense event; conditions are expected to be uncommon and must be proven by Combat V2 telemetry before final balance. No trait tiers; future specialization by new modular trait references if later approved.

Safety guards: Evasion remains non-guaranteed after hit/accuracy counterplay, including additive stacking; Pilot DEF mitigation has a central mitigation cap below full immunity; damage amplification scope is one qualified Action only, not multiplied into unrelated status ticks, multi-target actions or subsequent attacks unless each event independently qualifies. Caps, triggers and stacking semantics centralized and configurable; avoid duplicating modifier application during replay/batch simulation. No special user-only buffs.

### Next review: D.3 (NOT YET APPROVED)

Define LUK Lucky Buff modifiers, Shield-related traits and any Combat-special trait triggers with explicit pipeline slots and caps. Preserve exactly one Lucky Buff per Action, no independent second proc. Trait benefits inherit Class but should not mutate the source hardware stats.


## CANONICAL OVERRIDE — 8.2.3.D.1 PILOT-SCOPE TRAIT PIPELINE (APPROVED, 2026-10-21)

**THIS SECTION SUPERSEDES ALL PREVIOUS D.1 STAGE-ORDER DESCRIPTIONS** that implied Gear/Combat stats are merged before Class Trait processing. Earlier D.1 section remains solely as design history and MUST NOT be used as authoritative implementation pipeline.

### Canonical sequence

1. **Class Definition (Pilot):** six base attribute points totaling 20 (`ATK, DEF, AGI, ENE, SHD, LUK`).
2. **Pilot Instance Progression:** +10 freely allocated points at Level 1, plus legitimate allocated level-up points (+3 per Level per agreed rule) and any approved Pilot-scope progression; derive Pilot-owned combat metrics from these attributes with the canonical stat-conversion rules (do NOT conflate raw AGI points with Evasion %).
3. **Class Trait Modifier (inside Pilot scope):** resolve inherited `traitDefinitionIds`, condition eligibility at the appropriate event, and apply individually typed **additive** bonuses to the specified already-developed Pilot stat/effect channel. A Class Trait is innate/permanent ownership and does not itself level-scale or expire. A conditional modifier contributes **only while its actual trigger is satisfied**; otherwise contributes zero. It is still computed/accounted for in the Pilot scope; for event-specific parameters carry a conditioned Pilot-effective modifier into that event, not by rewriting GEAR/weapon base stats.
4. **Final Effective Pilot Stats / scoped eligible effect modifiers:** resolve stacking/order/caps/rounding using SYSTEM configuration and expose contribution breakdown for UI and debugging. Freeze canonical Pilot values or context-specific evaluation without double-applying on repeated simulation/replay.
5. **After Pilot scope is resolved**, combine with **GEAR / Skills / Combat V2** via their respective canonical pipeline. Trait does NOT change GEAR hardware base ATK, max speed, base Armor or original weapon damage definition. Preserve Evasion → Pilot DEF → Shield/Deflection → Armor → Hull, one Lucky Buff per Action and simulation independent of visual quality.

**Important additive semantics approved by user:** For bonus text like `+30% Evasion`, increase the *existing Evasion probability by 30 percentage points* (e.g. Pilot-derived Evasion 30% → 60%), **not** multiply 30% × 1.30 (=39%). More generally, a Trait's explicit `target`, `unit`, `operation` and `scope` govern how a `+XX%` UI label is shown: chance uses `ADD_PERCENTAGE_POINTS`; damage or mitigation uses a typed **additive percentage bonus to its specific modifier channel**, never an indiscriminate global multiplier. E.g. a qualified +100% Pilot damage contribution corresponds to +1.00 in a correctly scoped eligible damage multiplier channel, before Combat processes the attack; never write back to Weapon Base ATK or reapply a second time. The previously documented mitigation examples should be understood as one typed effectiveness bonus, not an opportunity for double multiplication across Pilot and Combat.

**Status:** pipeline and modifier interpretation APPROVED. Existing test magnitudes remain as agreed (+8% Victor Max Shield, +3 pp Lyra Evasion, +6% Selena Energy Weapon; conditional +30 pp Kaelen, +50% Pilot DEF effectiveness Marcus/Rhea, +100% qualified Action damage Nova). These defaults describe the effect target; Pilot-scope preparation does not mean GEAR hardware is permanently mutated. Operational stat targets like Shield capacity/weapon damage are emitted as **Pilot-origin modifier channels** to be applied once at the relevant integration point, with source attribution, not baked into base GEAR attributes. Condition predicates still require repository/Combat V2 audit. Exact stacking order/caps are config-driven and to be validated, not guessed.

**Regression checks REQUIRED in plan:** zero trait when unmet; Evasion 30%+30pp=60% prior to caps/counters; no mistaken 39%; one contribution per event even if state/replay updates; default class trait levels remain static; Player/AI identical; no change across LOW/MEDIUM/HIGH/AUTO rendering; UI details shows Base→Progression→Trait breakdown; avoid mislabeling +% relative where pp intended.


## 8.2.3.D.3 — Trait Defaults REVIEW REVISION (2026-10-21; awaiting final user review)

This section supersedes all older numerical suggestions for the following six Traits, including the D.1 Victor +8% prototype. User explicitly requests these six values and inclusion of Trait Type for **the entire D.3 review**. They are initial *test defaults*, not balance benchmark results. A Trait remains a fixed Class innate definition (not a timed unlock/tier); its modifier is prepared in Pilot scope and applied only once at the named eligible integration point.

### D.3.1 Lucky Buff traits — unchanged proposed values

| Class | Trait ID | Trait | Type | Default under review | Exact effect target / unit |
|---|---|---|---|---|---|
| Fortuna | `pilot_trait_calculated_chance` | May Mắn Có Tính Toán | SIGNATURE (passive effect) | +30% | Relative strength of existing, successfully triggered action-scoped Lucky Buff (strength ×1.30); *not* +30 percentage points to final damage/evasion |
| Fortuna | `pilot_trait_fortunate_timing` | Thời Cơ Vàng | CONDITIONAL | +15 percentage points | Lucky Buff proc chance inside same existing Action LUK-check flow, with global chance cap |
| Kaelen | `pilot_trait_operational_instinct` | Trực Giác Đặc Vụ | SIGNATURE (passive effect) | +20% | Relative strength of existing Lucky Buff (strength ×1.20) |
| Nova | `pilot_trait_highrisk_instinct` | Bản Năng Mạo Hiểm | PASSIVE | +25% | Relative strength of existing Lucky Buff (strength ×1.25) |

These four numbers are previous D.3 proposals, NOT separately revised by user yet. Exactly one Lucky Buff per Action; no extra roll, no newly created effect, and existing magnitude cap/efficiency apply.

### D.3.2 Shield — revised by user

| Class | Trait ID | Trait | Type | NEW test default | Target / application |
|---|---|---|---|---|---|
| Victor | `pilot_trait_shield_anchor` | Mỏ Neo Phòng Tuyến | PASSIVE | **+10%** Max Shield | Pilot-origin Shield capacity bonus; added into the explicitly typed Shield capacity modifier channel once during personal GEAR integration, **not** increasing SHD points or rewriting equipment base Shield |
| Valentine | `pilot_trait_safeguard` | Mái Khiên Nhân Ái | PASSIVE | **+30%** Shield Recovery | Relative bonus to amount restored by an already-valid Shield restoration support skill; not Battle-Time Regen, not Hull recovery, not new healing actions |

### D.3.3 SP Energy & Medic — revised by user

| Class | Trait ID | Trait | Type | NEW test default | Target / application |
|---|---|---|---|---|---|
| Aria | `pilot_trait_power_economy` | Phân Phối Năng Lượng | PASSIVE | **−15%** SP Energy Cost | Reduction of eligible skill SP Energy Cost, after eligibility and before configurable cost floor; never Skill Points |
| Aria | `pilot_trait_tactical_recovery` | Nhịp Điều Phối | PASSIVE | **+30%** SP Energy Regen | Bonus to recovery amount at central Battle-Time regeneration event, without creating independent timer |
| Selena | `pilot_trait_resonant_cast` | Cộng Hưởng Năng Lượng | CONDITIONAL | **−30%** SP Energy Cost | Only energy-tagged eligible skills on their activation; conditioned by supported skill tag, no zero-cost exploit |
| Valentine | `pilot_trait_field_medic` | Bàn Tay Cứu Hộ | PASSIVE | **+50%** Medic Recovery effectiveness | Bonus to amount/effect from already available eligible Medic recovery skill; never creates healing, repair, revival or rescue by itself |

**Classification reminder:** PASSIVE = effect requires no special battle trigger (though must have correct target/event); CONDITIONAL = additional explicit condition; SIGNATURE = Class/lore identity label and may mechanically behave passively or conditionally. Do not confuse `SIGNATURE` with an execution mode; rendering icon/tooltip should tell the effective rule.

**Math / stacking safety:** A `+XX%` affecting a scalar amount such as Max Shield, regen amount, recovered Shield or Medic recovery is an additive percentage contribution to that **specific scoped amount/modifier channel** (e.g. a solo +30% restoration contribution means 100 Shield restored →130). This is NOT the same operation as probability *percentage points* (`ADD_PERCENTAGE_POINTS`, e.g. 30% Evasion +30pp =60%) and never modifies raw Class SHD/ENE attributes. Cost reductions are effective typed cost modifiers with centralized stacking/floor. Lucky-buff magnitude modifiers must follow existing LUK strength cap and action semantics. Apply once, never both in Pilot stats and a second time in Combat. UI labels show units explicitly.

**User decision status:** Six revised magnitudes are requested by user as new defaults; full D.3 table presented for review and not yet globally closed. `Victor +8%` and former D.3 proposed `+20%` Shield Recovery / `−10%` Aria cost / `+20%` Aria regen / `−10%` Selena cost / `+25%` Medic recovery are **obsolete**. Earlier record retained only for historical trace.
