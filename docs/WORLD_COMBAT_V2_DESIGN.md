# STARFRONT WORLD — Combat V2 Architecture & Design Specification

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.32, 6.33, 6.34

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_ADMINCP_CONFIG_REFERENCE.md

## Scope
This document defines approved and planned architectural rules for STARFRONT WORLD Combat V2.
It establishes the boundary between tactical battle simulation and strategic state commitments.
This document describes future design specifications; it does not indicate that Combat V2 has already been implemented.

---

## 1. Architectural Boundary & Transaction Pipeline

Combat V2 is a tactical simulation engine executing in an isolated runtime sandbox. It interacts with the broader galaxy state strictly through a four-stage transactional pipeline:

```
[ WORLD Strategic State ]
         │
         ▼ (1) Encounter Lock & Snapshot Creation
[ EncounterSnapshot (Immutable) ]
         │
         ▼ (2) Tactical Combat V2 Simulation Execution
[ Combat V2 Engine (Interactive UI or Headless Fast-Forward) ]
         │
         ▼ (3) Battle Concluded & Receipt Generated
[ CombatResultReceipt (Cryptographically Validated) ]
         │
         ▼ (4) Authoritative WORLD State Commit
[ commitCombatResult() in combat-adapter.ts & Transaction Journal ]
```

### Systems Excluded from Combat V2 Scope
To prevent architectural bloat and state leakage, Combat V2 **MUST NOT** directly own or execute:
- National Treasury or currency calculations
- Tax collection or gross revenue accounting
- Long-term repair pipelines or HP/day regeneration
- Personnel recruitment, education, or academy cohorts
- Procurement or purchase of replacement GEAR
- National demographic census or population changes

Combat V2 is responsible solely for the tactical resolution of the battle, emitting unit status receipts, casualty summaries, round statistics, and tactical objectives.

---

## 2. Dynamic Combat Rosters

### Force Asymmetry
Combat V2 abandons the legacy 1v1 duel constraint of Combat V1 and does not impose symmetrical squad caps (e.g. 4v4 or fixed 30-unit arrays). Battle rosters are dynamically constructed from the forces assigned in the `EncounterSnapshot`:
- **Allied Roster**: May consist of the player's personal machine, attached allied NPC squad leaders, deployed escort wings, and local sector garrison detachments.
- **Opposing Roster**: May consist of lone reconnaissance probes, multi-tier Void raiding wings, or colossal Void Mothership strike groups with defensive escorts.
- **Asymmetric Confrontations**: Battles such as 1 scout vs. 8 drones, or 6 allied defenders vs. 24 invaders are fully native.

---

## 3. Individual GEAR Lifecycle & State Model

Every participating combat machine on the battlefield is tracked as an individual entity with its own operational status.

```
       ┌───────────────┐
       │    ACTIVE     │
       └───┬───────┬───┘
           │       │
    Retreat│       │HP reaches 0
    Ordered│       │
           ▼       ▼
┌──────────────┐  ┌───────────────┐
│  RETREATING  │  │   DESTROYED   │ (Permanent machine wreckage;
└──────┬───────┘  └───────────────┘  Pilot survival unresolved here)
       │Duration
       │elapsed
       ▼
┌──────────────┐
│  RETREATED   │ (Exited battlefield safely;
└──────────────┘  Eligible for strategic repair)
```

### Operational States
1. **ACTIVE**: The machine is operational on the frontline, contributing offensive firepower, defense, passive auras, and tactical skills.
2. **RETREATING**: The unit has initiated a tactical withdrawal sequence. It remains on the battlefield, is still targetable by enemy fire, and maintains defensive screening. Its offensive contribution may be reduced or suppressed according to configuration.
3. **RETREATED**: The machine has successfully cleared the combat theater. It is removed from active targeting and added to the post-battle recovery roster.
4. **DESTROYED**: The machine's HP has reached `0`. The airframe is permanently lost and cannot be repaired. The fate of the pilot is handed off to the Pilot Survival & Rescue pipeline (`docs/WORLD_PILOT_SURVIVAL_RESCUE.md`).

---

## 4. End-of-Round Aggregate Recalculation

Combat V2 operates in discrete tactical rounds. At the conclusion of each round, the engine performs a complete aggregate recalculation:
- **Unit Pruning**: Units entering `DESTROYED` or `RETREATED` during the round cease contributing to offensive output, defensive ratings, and faction auras for subsequent rounds.
- **Dynamic Targeting**: Targeting algorithms automatically re-index viable targets, avoiding dead machines.
- **Preservation of Base Definitions**: Unit base stats and loadout templates are never destructively mutated during simulation; all current-round states are tracked in operational instance layers.

---

## 5. Player Control vs. NPC AI Simulation

Combat V2 supports dual execution modes:
- **Interactive Player Command**: When the player participates, they directly command their personal machine's actions (basic attacks, tactical skills, weapon heat management) and execute faction-wide Commander Orders.
- **Allied & Enemy NPC AI**: NPC units select targets, deploy skills, and evaluate tactical retreat based on archetype behavior profiles (Aggressive, Defensive, Support, Skirmisher).
- **Headless Simulation (NPC-Only Engagements)**: When a battle involves only NPCs (e.g., automated patrol clashes or garrison defense while the player is deployed elsewhere), Combat V2 must execute headlessly, resolving round-by-round calculations deterministically via PRNG seeds without opening interactive UI panels.

---

## 6. Commander Authority & Strategic Orders

Commander Authority represents faction-level battlefield leadership and is strictly decoupled from the player's personal machine HP:
- **Survival of Authority**: If the player's machine is disabled, destroyed, or retreats, Commander Authority remains active. The player continues directing the broader battle as tactical commander from secondary communication links.
- **Commander Strategy System**: Each faction may maintain one active strategic stance per round (e.g., *Balanced*, *Focus Fire*, *Defensive*, *Assault*, *Tactical Withdrawal*).
- **Queue & Confirmation Flow**: Strategy adjustments follow a strict two-step execution pattern:
  ```
  Player Selects Strategy → Player Confirms → Strategy Queued → Takes Effect at Start of Next Round
  ```

---

## 7. Retreat Mechanics

- **Approved Retreat Duration Default**: `defaultRetreatDurationRounds = 1` is an explicitly **APPROVED DEFAULT**. An order to retreat requires **1 full tactical round** of transitional flight (`RETREATING`) before transitioning to `RETREATED`. This parameter is centrally configurable.
- **Vulnerability**: A unit in `RETREATING` status remains an active target for enemy interception on the battlefield.
- **Combat Contribution Semantics**: While in retreat, units may retain defensive contribution and their offensive output may be reduced or removed. The current implementation uses:
  - `retreatOffenseReductionRatio = 1.0` (100% suppression of offensive fire)
  - `retreatDefenseRetentionRatio = 1.0` (100% retention of defense rating)
  These two values are **TEMPORARY TECHNICAL DEFAULTS** for neutral engine behavior. They are **NOT finalized gameplay balance**; exact balance percentages remain unresolved and configurable.

---

## 8. Force Morale (Conceptual Hook)

Combat V2 reserves architectural hooks for Force/Squad Morale:
- Morale reflects unit confidence, combat fatigue, and psychological shock resulting from friendly losses or devastating enemy strikes.
- Morale states will eventually influence combat efficiency, willingness to hold the line, and automated NPC retreat triggers.
- **Baseline Morale**: `defaultMoraleValue = 100` is an **UNRESOLVED CONFIG DEFAULT** required for engine and test operation, NOT finalized gameplay balance.
- **Panic Threshold**: `moraleThresholdPanic = 30` remains a **CONCEPTUAL EXAMPLE**, not an approved gameplay balance rule.
- *Rule*: Future phases must not invent arbitrary hardcoded morale formulas until formal design approval is codified.

---

## 8.1 Technical Safety Guard: Round Limit

- **Engine Safety Round Cap**: `maxCombatRounds = 30` is a **TECHNICAL SAFETY DEFAULT**. It acts strictly as an engine-level guard preventing infinite simulation loops (e.g. two invincible defensive units failing to damage each other).
- **Distinction**: It is **NOT** a canonical gameplay rule or battle design limit. If a battle reaches 30 rounds without a tactical resolution, the engine terminates with a stalemate receipt to safeguard the event queue.

---

## 9. Strategic Battlefield Support Entities

Combat V2 introduces strategic Support Entities operating outside the standard GEAR roster:
- **Support Entity Classes**: Orbital Defense Stations, Fleets/Carriers in high orbit, Ground Base Missile Batteries, and Logistics Shuttles.
- **Passive Support**: Ongoing battlefield modifiers (e.g. radar jamming, energy grid stabilization, orbital shielding).
- **Active Support**: Cooldown-based call-in abilities (e.g. Orbital Artillery Barrage, Emergency Shield Boost, Tactical Recon Scan).
- **Control Modes**: Support call-ins will feature both Manual (player triggered) and Auto-fire modes in Phase 6.33.

---

## 10. Battlefield UI/UX Direction (Phase 6.33 Target)

The tactical visualization for Combat V2 follows a 2D Sci-Fi Tactical Operations Command aesthetic:
- **Abstract Tactical Formation**: Units arranged by combat side, wing formation, and range class (Vanguard / Mid-line / Rear-line / Reserve). Pixel-level physics pathfinding is explicitly avoided.
- **State Visualization**: Immediate visual recognition of unit status (Active, Armor Depleted, Retreating, Destroyed) with animated telemetry bars.
- **Live Combat Log**: Clear chronological action log detailing skill activations, damage rolls, critical hits, and disengagements.
- **Tactical Command Deck**: Dedicated interface panels for player skill deployment, next-round strategy selection, and orbital support call-ins.

---

## 11. Clarification: Phase 6.31 Temporary Mission Heuristics

> [!IMPORTANT]
> In Phase 6.31, temporary simulation heuristics (e.g., `baseSuccessChance = 75`, `+15%` player command bonus, fixed casualty counts of 10/15/25, and hardcoded resource rewards) were implemented in `lib/game/world/mission-dispatch.ts` solely to allow the initial Mission Dispatcher to resolve operations before Combat V2 was built.
>
> **These Phase 6.31 heuristics are temporary placeholders and MUST NOT be treated as canonical Combat V2 rules.**
> When Combat V2 is implemented in Phase 6.32, all tactical combat resolutions will transition to the authoritative round-by-round Combat V2 engine.
