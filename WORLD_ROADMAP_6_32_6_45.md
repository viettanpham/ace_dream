# STARFRONT WORLD — Strategic Architecture Roadmap (Phase 6.32 → 6.45)

> **CRITICAL INSTRUCTION FOR ALL AI AGENTS & DEVELOPERS:**
> Read this file first before implementing any STARFRONT WORLD phase from 6.32 through 6.45.
> Next, read `docs/WORLD_SYSTEM_INVARIANTS.md`, followed by the phase-specific design documents designated for your current phase.
> Do NOT begin work on any phase without verifying that its prerequisites are implemented, tested, and compiled.

---

## 1. Executive Status Summary

| Phase | Milestone Title | Status | Primary Design Documents |
| :--- | :--- | :--- | :--- |
| **Phase 6.31** | **Mission Dispatch & Operations Archive** | **DONE** | `lib/game/world/mission-dispatch.ts`, `operations-archive.ts` |
| **Phase 6.32** | **Combat V2 Core Engine** | **DONE** | `docs/WORLD_COMBAT_V2_DESIGN.md`, `docs/WORLD_SYSTEM_INVARIANTS.md` |
| **Phase 6.33** | **Combat Command, Retreat, Support & Battle UI** | **DONE** | `docs/WORLD_COMBAT_V2_DESIGN.md`, `components/game/world/combat-v2` |
| **Phase 6.33_FIX1** | **Localized Locking & Combat Lock Isolation** | **DONE** | `components/game/world/world-map.tsx`, `combat-adapter.ts` |
| **Phase 6.33_FIX2** | **Settings & UI Scaling Preservation** | **DONE** | `lib/game/ui-settings.ts`, `global-settings-modal.tsx` |
| **Phase 6.33_FIX3** | **Typography Scaling & Text Overflow Resilience** | **DONE** | `lib/game/ui-settings.ts`, `components/game/world/combat-v2` |
| **Phase 6.33_FIX4** | **Dispatch Destination UX, Canonical Threat & Threat AdminCP** | **DONE** | `threat-engine.ts`, `quick-dispatch-dock.tsx`, `admin-settings-modal.tsx` |
| **Phase 6.34** | **Pilot Survival & Rescue** | **DONE** | `docs/WORLD_PILOT_SURVIVAL_RESCUE.md`, `lib/game/world/pilot-survival-engine.ts` |
| **Phase 6.35** | GEAR Logistics, Repair & Pilot Recovery | PLANNED / NOT STARTED | `docs/WORLD_GEAR_LOGISTICS_REPAIR.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` |
| **Phase 6.36** | National Population & Personnel Pools | PLANNED / NOT STARTED | `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`, `docs/WORLD_NATIONAL_ECONOMY.md` |
| **Phase 6.37** | FREESKA & NEWHORIZON Training | PLANNED / NOT STARTED | `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` |
| **Phase 6.38** | Technical / Logistics Workforce | PLANNED / NOT STARTED | `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`, `docs/WORLD_GEAR_LOGISTICS_REPAIR.md` |
| **Phase 6.39** | Repair Logistics Network | PLANNED / NOT STARTED | `docs/WORLD_GEAR_LOGISTICS_REPAIR.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` |
| **Phase 6.40** | National Economy, Tax & Treasury | PLANNED / NOT STARTED | `docs/WORLD_NATIONAL_ECONOMY.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` |
| **Phase 6.41** | National Summary UI | PLANNED / NOT STARTED | `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_NATIONAL_ECONOMY.md` |
| **Phase 6.42** | Sector / Base Details UI | PLANNED / NOT STARTED | `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_GEAR_LOGISTICS_REPAIR.md` |
| **Phase 6.43** | Buildings, Facilities & Rescue Infrastructure | PLANNED / NOT STARTED | `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_PILOT_SURVIVAL_RESCUE.md` |
| **Phase 6.44** | WORLD Statistics, History & Graphs | PLANNED / NOT STARTED | `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_NATIONAL_ECONOMY.md` |
| **Phase 6.45** | AdminCP Consolidation & Config UX | PLANNED / NOT STARTED | `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`, All WORLD docs |

---

## 2. Core Architectural Principles

### A. UI/UX Design Principle: Presentation Inference vs. Balance Integrity
- AI agents **MAY** extrapolate and improve: information hierarchy, card layouts, tabs, charts, tooltips, drawers, responsive layouts, semantic tags, and contextual breakdowns.
- AI agents **MAY NOT** invent: gameplay bonuses, economic costs, tax rates, damage formulas, training durations, resource currencies, or arbitrary probability dice rolls.
- *Rule*: Presentation may be inferred. Gameplay balance cannot.

### B. Centralized Configuration Principle
Every value designated as configurable must possess one authoritative configuration path declared in `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md` and centralized in runtime config stores. Magic numbers scattered deep inside gameplay logic are strictly prohibited.

### C. Reference to Phase 6.31 Reference & Temporary Heuristics
Phase 6.31 is fully implemented and operational (Mission Dispatcher, Operations Archive, NPC takeover, action timeline, bounded retention, idempotency guards).
Temporary heuristics in `lib/game/world/mission-dispatch.ts` (+15% player command bonus, fixed 10/15/25 casualties, hardcoded resource gains) are temporary placeholders for Phase 6.31. **They must not become canonical Combat V2 rules.**

---

## 3. Phase-by-Phase Roadmap Details

### Phase 6.32 — Combat V2 Core Engine
- **Primary Documents**: `docs/WORLD_COMBAT_V2_DESIGN.md`, `docs/WORLD_SYSTEM_INVARIANTS.md`
- **Scope**:
  - Battle-specific Encounter Snapshot data structures
  - Dynamic force roster supporting asymmetric, unequal force sizes
  - Individually addressable GEAR entities with independent HP tracking
  - Tactical round lifecycle execution
  - Four GEAR states: `ACTIVE`, `RETREATING`, `RETREATED`, `DESTROYED`
  - End-of-round aggregate force recalculation (pruning destroyed/retreated units)
  - Decoupling of Commander Authority from player personal machine HP
  - Current and queued Commander Strategy foundation
  - Morale and Support entity state/interface hooks
  - Headless NPC-only battle simulation capability
  - Structured `CombatResult` and immutable WORLD state commit boundary
  - Strict idempotency protection for combat commits
- **Config & Balancing Classification**:
  - *Approved Design Default*: `defaultRetreatDurationRounds = 1`
  - *Technical Safety Default*: `maxCombatRounds = 30` (engine guard against infinite loops, NOT a canonical gameplay rule)
  - *Temporary Technical Defaults*: `retreatOffenseReductionRatio = 1.0`, `retreatDefenseRetentionRatio = 1.0` (unresolved gameplay balance; neutral technical defaults)
  - *Unresolved / Conceptual*: `defaultMoraleValue = 100` (unresolved baseline), `moraleThresholdPanic = 30` (conceptual example)

### Phase 6.33 — Combat Command, Retreat, Support & Battle UI
- **Primary Documents**: `docs/WORLD_COMBAT_V2_DESIGN.md`, `docs/WORLD_BASE_SECTOR_UX.md`
- **Prerequisite**: Phase 6.32
- **Scope**: Player machine skill deployment UI, Commander Strategy selection and queue confirm UI, Player and NPC retreat interaction, Support Call-in Manual/Auto controls, 2D tactical battlefield visualization, live combat logs.

### Phase 6.34 — Pilot Survival & Rescue (DONE)
- **Primary Documents**: `docs/WORLD_PILOT_SURVIVAL_RESCUE.md`
- **Prerequisite**: Phase 6.32 (consumes destroyed GEAR candidates)
- **Scope**: Post-destruction Survival Score calculation (`SAFE`, `PROTECTED`, `CRITICAL`, `KIA`), SAR extraction vs. capture resolution, rescue facility power hooks, dynamic POW hostage rescue mission hooks, AdminCP SAR configuration, National POW Registry, and Combat Conclusion UI integration.

### Phase 6.35 — GEAR Logistics, Repair & Pilot Recovery
- **Primary Documents**: `docs/WORLD_GEAR_LOGISTICS_REPAIR.md`
- **Prerequisite**: Phase 6.32, Phase 6.34
- **Scope**: Irrevocable loss write-offs, Treasury replacement procurement, Waiting-for-Budget purchase queue, Sale Event modifiers, 10-day pilot recovery pipeline (psychological, procurement, familiarization), retreated airframe repair normalized to HP/in-game day, dynamic Repair Events.

### Phase 6.36 — National Population & Personnel Pools
- **Primary Documents**: `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`, `docs/WORLD_NATIONAL_ECONOMY.md`
- **Scope**: Macro-demographic census, controlled territory vs. uncontrolled territory distribution, three canonical personnel pools (Regular Forces max 1M, Auxiliary Forces max 200k, Logistics Workforce max 100k), configurable capacity growth intervals (DAY/MONTH/YEAR), strict anti-autospawn conservation.

### Phase 6.37 — FREESKA & NEWHORIZON Training
- **Primary Documents**: `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`
- **Prerequisite**: Phase 6.36
- **Scope**: FREESKA 5-year officer academy cohort processing (100k capacity), NEWHORIZON 53-day post-graduate combat readiness facility (drills, field tests, gear calibration, tactical certification), training cap policies (`FINISH_CURRENT`).

### Phase 6.38 — Technical / Logistics Workforce
- **Primary Documents**: `docs/WORLD_NATIONAL_PERSONNEL_TRAINING.md`, `docs/WORLD_GEAR_LOGISTICS_REPAIR.md`
- **Prerequisite**: Phase 6.36
- **Scope**: Vocational technical apprenticeship tracks (Repair Technicians, Mechanics, Avionics, Manufacturing), Logistics Workforce replenishment, assignment to Base/Fleet/Sector engineering hubs.

### Phase 6.39 — Repair Logistics Network
- **Primary Documents**: `docs/WORLD_GEAR_LOGISTICS_REPAIR.md`, `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`
- **Prerequisite**: Phase 6.35, Phase 6.38
- **Scope**: National/global repair network grid, central technician bonus, hyperlane graph distance decay (Fixed or Base-Ratio models), non-negative clamping invariant, local base effective HP/day aggregation.

### Phase 6.40 — National Economy, Tax & Treasury
- **Primary Documents**: `docs/WORLD_NATIONAL_ECONOMY.md`
- **Prerequisite**: Phase 6.36
- **Scope**: National Treasury ledger, gross tax calculation across controlled sectors, distance/war disruption modifiers, actual-personnel upkeep deductions (Regular ×2.0, Auxiliary ×1.0, Logistics ×0.5), annual fiscal tax cycles, single-commit ledger records.

### Phase 6.41 — National Summary UI
- **Primary Documents**: `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_NATIONAL_ECONOMY.md`
- **Prerequisite**: Phases 6.36, 6.39, 6.40
- **Scope**: High-level national dashboard displaying Population distribution, Regular/Auxiliary/Logistics force bars, National repair throughput, Treasury delta, fiscal calendar countdown, and regional breakdown.

### Phase 6.42 — Sector / Base Details UI
- **Primary Documents**: `docs/WORLD_BASE_SECTOR_UX.md`
- **Prerequisite**: Phases 6.39, 6.40
- **Scope**: Contextual drill-down interface for individual starbases and sectors, displaying local garrison strength, repair bays, civilian demographics, tax efficiency, threat history, and regional defense status.

### Phase 6.43 — Buildings, Facilities & Rescue Infrastructure
- **Primary Documents**: `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_PILOT_SURVIVAL_RESCUE.md`
- **Prerequisite**: Phase 6.34, Phase 6.42
- **Scope**: Sector facility management interface (SAR Command Centers, Fleet Rescue Docks, Repair Bays, Barracks), facility rank/level displays, active personnel assignment, and structural status drawers.

### Phase 6.44 — WORLD Statistics, History & Graphs
- **Primary Documents**: `docs/WORLD_BASE_SECTOR_UX.md`, `docs/WORLD_NATIONAL_ECONOMY.md`
- **Prerequisite**: Phases 6.40, 6.41
- **Scope**: Bounded historical time-series analytics (7 days, 30 days, 1 year) visualizing population growth, treasury net changes, military deployments, casualty trends, repair output, and mission completion rates.

### Phase 6.45 — AdminCP Consolidation & Config UX
- **Primary Documents**: `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`
- **Prerequisite**: Phases 6.32 through 6.44
- **Scope**: Comprehensive configuration panel consolidating all game systems, category tabs, live parameter tuning, validation bounds, reset-to-defaults controls, and runtime state preservation.

---

## 4. Phase Dependency Graph

```
Phase 6.31 (DONE)
      │
      ▼
Phase 6.32 (Combat V2 Core Engine — DONE)
      ├───────────────────────────────┐
      ▼                               ▼
Phase 6.33 (Combat Command UI — DONE)   Phase 6.34 (Pilot Survival & Rescue — DONE)
                                      │
                                      ▼
                                 Phase 6.35 (GEAR Logistics & Repair)
                                      │
┌─────────────────────────────────────┴─────────────────────────────────────┐
│                                                                           │
▼                                                                           ▼
Phase 6.36 (National Population & Pools)                       Phase 6.38 (Technical Workforce)
      ├───────────────────────┐                                             │
      ▼                       ▼                                             ▼
Phase 6.37 (Academies)   Phase 6.40 (Economy & Tax)            Phase 6.39 (Repair Logistics Network)
                              │                                             │
                              └──────────────────────┬──────────────────────┘
                                                     │
                                                     ▼
                                      Phase 6.41 (National Summary UI)
                                                     │
                                                     ▼
                                      Phase 6.42 (Sector / Base Details UI)
                                                     │
                                                     ▼
                                      Phase 6.43 (Facilities & Infrastructure)
                                                     │
                                                     ▼
                                      Phase 6.44 (Statistics & History Graphs)
                                                     │
                                                     ▼
                                      Phase 6.45 (AdminCP Consolidation)
```
