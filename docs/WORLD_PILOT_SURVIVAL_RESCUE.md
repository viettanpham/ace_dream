# STARFRONT WORLD — Pilot Survival & Search-and-Rescue (SAR)

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.34, 6.43

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_COMBAT_V2_DESIGN.md
- WORLD_ADMINCP_CONFIG_REFERENCE.md

## Scope
This document defines approved and planned architectural rules for Pilot Survival after machine destruction, the Search-and-Rescue (SAR) pipeline, and Enemy Capture mechanics.
This document represents design source-of-truth; it does not indicate that Pilot Survival & Rescue features are already implemented.

---

## 1. Core Principle: Decoupling Pilot Life from Machine Hull
In the STARFRONT universe, combat machines (GEARs) are equipped with armored ejection pods, emergency inertial dampening bulkheads, and automated emergency beacons.
A GEAR being DESTROYED does NOT automatically mean the pilot is KIA (Killed in Action).
When a machine's hull integrity drops to `0`, the machine is permanently lost, but the pilot enters an independent Survival Resolution pipeline.

## 2. Pilot Survival Score & Outcome Tiers
Upon destruction of a machine during combat, the system calculates a conceptual Survival Score (0 - 100) evaluated against configurable outcome thresholds:
- **SAFE** ($\ge 70$): Ejection successful, pilot uninjured or with minor concussions. Immediate locator beacon active; high baseline extraction probability.
- **PROTECTED** ($50 - 69$): Ejection pod deployed but sustained localized impacts. Minor injuries, beacon functional under low power. Standard rescue parameters apply.
- **CRITICAL** ($30 - 49$): Pod damaged, pilot severely injured or trapped in cockpit wreckage. Life-support ticking down. Ejection beacon erratic. Survival contingent on battlefield control and dedicated rescue assets.
- **KIA** ($\le 29$): Catastrophic reactor rupture or structural collapse before ejection sequence. Pilot lost in action permanently.

## 3. Post-Battle SAR Resolution
Pilots in SAFE, PROTECTED, or CRITICAL conditions are evaluated for extraction at or following the conclusion of the battle.
- Friendly Victory significantly improves rescue conditions.
- Defeat still permits survival, covert extraction, or capture.

## 4. Rescue vs. Capture Probabilities
- Separate: Rescue Power, Rescue Chance, Capture Chance, Final Result (RESCUED, CAPTURED, KIA, MISSING).
- Baseline starting concepts: Base Rescue 30%, Base Capture 40%, Facility bonus +10% per tier (all configurable). Clamped to safe probability bounds.
- Captured pilots transition into the National POW registry and unlock rescue operations in the Mission Dispatcher.
