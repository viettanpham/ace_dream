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
