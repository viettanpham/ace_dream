# STARFRONT WORLD — System Invariants

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.31, 6.32, 6.33, 6.34, 6.35, 6.36, 6.37, 6.38, 6.39, 6.40, 6.41, 6.42, 6.43, 6.44, 6.45

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_COMBAT_V2_DESIGN.md
- WORLD_ADMINCP_CONFIG_REFERENCE.md

## Scope
This document defines approved/planned STARFRONT WORLD system invariants that future AI agents and engineers MUST NOT violate.
It serves as the immutable constitutional boundary for the STARFRONT WORLD strategic layer and combat integrations.

---

## Non-Negotiable System Invariants

### 1. Combat V2 Modular Replaceability
Combat V2 must remain an independent, swappable simulation module. Its interfaces must be designed such that Combat V2 can be upgraded or replaced by Combat V3 in the future without modifying or corrupting the WORLD state schema or transaction semantics.

### 2. Separation of Combat Simulation and WORLD State Commit
Combat simulation (`CombatArena`, fast-forward engine, round simulation) runs in its own execution context and must never mutate `WorldState` directly. State transitions occur strictly through a two-stage transaction: an immutable `EncounterSnapshot` at encounter lock, followed by an authoritative WORLD State Commit via `commitCombatResult()` using a validated `CombatResultReceipt`.

### 3. Idempotent Combat Result Commits
Every combat operation is tagged with a unique `transactionId`. Commits to the WORLD state (and the Transaction Journal) must be strictly idempotent: committing the same receipt multiple times must execute exactly once and return the previous transaction receipt without duplicating casualties, resource changes, or sector flips.

### 4. No Duplicate Dispatcher or Operations Archive
The existing `lib/game/world/mission-dispatch.ts` and `lib/game/world/operations-archive.ts` are the canonical dispatch and archive stores. Future phases must NEVER instantiate parallel dispatchers, secondary event archive stores, or shadow state objects.

### 5. GEAR Destruction Permanence (HP = 0)
When an individual GEAR machine reaches `HP = 0` during combat, it enters the `DESTROYED` state permanently. A destroyed machine is total wreckage and cannot be repaired back into service. It must be written off from active inventory. Replacement requires new procurement through the National Logistics/Treasury pipeline.

### 6. Pilot Survival Is Decoupled from Machine Destruction
A GEAR machine being destroyed does NOT automatically equate to pilot KIA (Killed In Action). Pilot survival is governed by an independent Survival & Rescue pipeline (`WORLD_PILOT_SURVIVAL_RESCUE.md`). Pilots may eject, be protected by cockpit bulkheads, be rescued, captured, or declared missing.

### 7. Preservation of Commander Authority
A player's strategic Commander Authority and command role are independent of the operational status of their personal GEAR. If the player's personal machine is disabled, destroyed, or retreats from the tactical battlefield, Commander Authority is NOT lost: the player continues issuing faction-level tactical orders, commander strategies, and support strikes for the remainder of the engagement.

### 8. Dynamic Roster Asymmetry
Battles must not assume symmetrical or fixed squad sizes (such as 1v1, 4v4, or 1 player + 29 NPCs). Combat V2 must dynamically scale to the actual force composition assigned from the WORLD layer (e.g. 1 solitary scout vs. 12 Void interceptors, or 3 allied combat wings against an orbital vanguard).

### 9. Conservation of GEAR Entities
No persistent GEAR units may be invented outside of the authoritative `WorldState` military ledger, base garrisons, or active deployment registries. Scripted quest encounters or special event units must be explicitly designated as temporary or contextual in their event descriptors.

### 10. Personnel Pool Growth Does Not Auto-Spawn Troops
Increasing the maximum capacity of Regular, Auxiliary, or Logistics personnel pools (via yearly growth or infrastructure upgrades) increases the ceiling ONLY. It NEVER automatically generates or spawns new personnel. Living personnel must flow strictly through the demographic pipeline: `Population → Recruitment → Academy/Vocational Training → Qualified Pool → Active Assignment`.

### 11. Zero Double-Counting of Personnel
Every military and civilian personnel entity must belong to exactly one pool at any given moment: Regular Forces, Auxiliary Forces, or Logistics Workforce. Personnel transitions between pools (such as graduating, transfer, or reserve mobilization) must preserve conservation: subtracting from source before adding to target.

### 12. Repair Normalized to HP Per In-Game Day
All long-term mechanical repairs in the STARFRONT WORLD layer must be standardized in units of `HP per in-game DAY` (`HP/day`). Do not use real-time seconds or arbitrary combat-tick intervals for strategic repairs.

### 13. Non-Negative Global Repair Network Contribution
Distance decay along the galactic hyperlane graph reduces the effective contribution from national repair hubs as distance increases. However, the calculated global network contribution must be clamped at `>= 0`. Distance decay must NEVER turn into a negative penalty that damages local base repairs.

### 14. Zero Economic Contribution from Uncontrolled Sectors
Sectors not under sovereign VSS control (`sovereignty !== 'vss'`) or sectors classified as `lost` contribute exactly zero (`0`) to national tax revenue, industrial output, and active demographic growth. Occupied or hostile populations are treated as suppressed and cannot be taxed by the central treasury unless a future phase explicitly introduces an approved counter-insurgency or occupation doctrine.

### 15. Single-Commit Treasury & Ledger Transitions
National Treasury deltas (tax collection, personnel upkeep, equipment procurement, repair outlays, and combat prize bonuses) must be committed exactly once per billing/transaction cycle into the National Ledger with a verifiable transaction record. Negative net balances must be classified as budget deficits, never as "negative tax".

### 16. Centralized Configuration Authority
All balance parameters, economic rates, threshold scores, and training durations marked as configurable must be maintained through centralized configuration records (`lib/game/world/simulator-config.ts` or AdminCP). Hardcoding arbitrary magic numbers deep inside feature components is prohibited.

### 17. Presentation Inference vs. Gameplay Balance Discipline
AI agents and developers building frontend components MAY freely extrapolate and improve presentation, layouts, chart visualizations, drawer hierarchies, and semantic styling to provide an exceptional tactical UX. AI agents MUST NEVER invent new gameplay balance rules, unapproved stat multipliers, hidden taxes, or artificial combat buffs under the guise of UI styling.

### 18. Strict Save Architecture Isolation
`STARFRONT_WORLD_SAVE_V1` and `STARFRONT_SAVE_DATA_V4` (the standalone RPG player save) must remain strictly isolated. Neither file may embed or corrupt the root schema of the other. All WORLD state serialization must pass through CRC32 envelope validation in `lib/game/world/storage.ts`.

### 19. Defensive Backward-Compatibility Initialization
When loading older `WorldState` save revisions, loading routines in `storage.ts` must defensively initialize newly added fields (e.g. `missionDispatches: {}`, `operationsArchiveConfig`, and future combat/personnel registries) with safe, deterministic fallback defaults without corrupting user progress or failing validation.

### 20. Strict Phase Completion Discipline
Future roadmap phases (6.32 through 6.45) may introduce interfaces, types, and hooks anticipating subsequent phases. However, a phase MUST NEVER be marked `DONE` or reported as complete until all features within its approved scope are actually coded, integrated into the runtime, and verified via automated tests.
