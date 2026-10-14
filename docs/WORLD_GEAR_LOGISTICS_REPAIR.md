# STARFRONT WORLD — GEAR Logistics, Repair & Airframe Procurement

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.35, 6.38, 6.39, 6.42

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_ADMINCP_CONFIG_REFERENCE.md

## Scope
This document defines approved and planned architectural rules for Destroyed Airframe Write-Offs, Replacement Procurement, Pilot Recovery Pipelines, Retreated Airframe Repair (HP/day), and the Global Repair Network with Hyperlane Distance Decay.

## 1. Destroyed GEAR: Irrevocable Loss & Replacement Procurement
- Destroyed airframes cannot be repaired back into active service.
- Base Airframe Price: 10,000 Credits (configurable). Sale Events apply dynamic ratio.
- Waiting-for-Budget Queue: Price locks only upon successful payment transaction.

## 2. Surviving Downed Pilot Recovery Pipeline
- Sequential pipeline: Psychological Recovery (3d) + Procurement (2d) + Familiarization (5d) = 10 in-game days. KIA pilots do not enter.

## 3. Retreated Airframe Repair & Normalization
- All strategic repairs normalized to HP per in-game DAY (HP/day).
- Dynamic Repair Events update active repair rates in real time.

## 4. Global Repair Network & Distance Decay
- Central base contribution radiates outward.
- Hyperlane graph distance (edges/days), never pixel distance. Clamped at $\ge 0$.

## 5. Asset Condition, Damage Overflow & Combat Condition Gate
- `ConditionHPMax = MaxHP`: Asset Condition tracks mechanical wear and operational reliability independently of combat HP.
- Condition does not directly degrade Offense, Defense, or Mobility stats in current design.
- Combat Damage Overflow formula:
  ```ts
  HPAfterDamage = CurrentHP - IncomingDamage
  RawConditionAfterDamage = CurrentConditionHP - IncomingDamage
  ConditionOverflowDamage = Math.max(-RawConditionAfterDamage, 0)
  NewConditionHP = Math.max(RawConditionAfterDamage, 0)
  NewHP = Math.max(HPAfterDamage - ConditionOverflowDamage, 0)
  ```
- Combat Condition Gate: `CombatMinimumConditionRatio = 0.05` (Approved Default, configurable).
  - Units falling to $\le 0.05$ Condition ratio trigger `COMBAT_UNFIT` and must retreat to Mother Ship / Command Ship / Hangar via retreat flow.
  - Mission-specific requirements may demand higher ratios (e.g. Rescue Ship requires `ConditionRatio = 1.00`).

## 6. Field Repair vs. Full Workshop Repair
- Field Repair: `FieldRepairConditionRecoveryRatio = 0.50` (Configurable).
  ```ts
  FieldConditionRecovered = Math.ceil(ActualHPRepaired * FieldRepairConditionRecoveryRatio)
  ```
  Field and Nano Repair never restore Condition to 100% automatically.
- Workshop Full Repair: Full repair at Base, Workshop, or Hangar restores `ConditionHP = ConditionHPMax` as it includes complete technical overhaul.

## 7. Base & Ship Shared Repair Capacity & Maintenance
- Base Capacity: `BaseInstallationRepairHpDay = FacilityRepairCapacityPerDay + WorkerRepairCapacityPerDay`.
  - Shared between Combat HP Repair (Priority 1) and Scheduled Maintenance (Priority 2).
- Ship Capacity: `ShipRepairCapacityPerDay = ShipFacilityRepairCapacityPerDay + ShipWorkerRepairCapacityPerDay`. Reuses Base semantics.
- Ship Maintenance Efficiency: `ShipMaintenanceEfficiencyRatio = 1.5` (Approved Default, independent config).
  ```ts
  ShipConditionRepairPerDay = AllocatedShipMaintenanceRepairCapacity * ShipMaintenanceEfficiencyRatio
  ```

