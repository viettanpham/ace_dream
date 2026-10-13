# STARFRONT WORLD — AdminCP Configuration Reference & Balancing Registry

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.32, 6.33, 6.35, 6.36, 6.37, 6.38, 6.39, 6.40, 6.45

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_COMBAT_V2_DESIGN.md

## Scope
This document serves as the authoritative configuration registry for STARFRONT WORLD.
All configurable parameters across combat, personnel, repair, economy, and simulation are declared here.
It distinguishes between APPROVED DEFAULT, CONCEPTUAL EXAMPLE, and UNRESOLVED DESIGN.

---

## 1. Combat V2 Configuration (`combatV2Config`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `defaultRetreatDurationRounds` | `number` | `1` | **APPROVED DEFAULT** | Number of completed combat rounds a unit spends in `RETREATING` before transitioning to `RETREATED`. |
| `maxCombatRounds` | `number` | `30` | **APPROVED DEFAULT** | Safety round cap preventing infinite engagement loops. |
| `retreatOffenseReductionRatio` | `number` | `1.0` | **APPROVED DEFAULT** | Ratio of offensive firepower suppressed while retreating (1.0 = 100% suppression, unit does not fire while disengaging). |
| `retreatDefenseRetentionRatio` | `number` | `1.0` | **APPROVED DEFAULT** | Ratio of defensive armor/evasion preserved while retreating (unit remains targetable but screens itself). |
| `defaultMoraleValue` | `number` | `100` | **APPROVED DEFAULT** | Baseline squad/force morale rating at engagement start. |
| `moraleThresholdPanic` | `number` | `30` | **CONCEPTUAL EXAMPLE** | Morale level below which NPC units evaluate automated tactical withdrawal. |
| `supportedFactions` | `string[]` | `["vss", "void"]`| **APPROVED DEFAULT** | Faction keys participating in Combat V2 engagements. |

---

## 2. Pilot Survival & Rescue Configuration (`survivalConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `thresholdSafe` | `number` | `70` | **APPROVED DEFAULT** | Score $\ge 70$ yields `SAFE` tier. |
| `thresholdProtected` | `number` | `50` | **APPROVED DEFAULT** | Score $50 - 69$ yields `PROTECTED` tier. |
| `thresholdCritical` | `number` | `30` | **APPROVED DEFAULT** | Score $30 - 49$ yields `CRITICAL` tier. Below 30 yields `KIA`. |
| `baseRescueChance` | `number` | `0.30` | **CONCEPTUAL EXAMPLE** | Baseline probability (30%) of friendly extraction. |
| `baseCaptureChance` | `number` | `0.40` | **CONCEPTUAL EXAMPLE** | Baseline probability (40%) of enemy capture. |
| `facilityRescuePowerBonusPerTier` | `number` | `0.10` | **CONCEPTUAL EXAMPLE** | Additional rescue probability per facility tier. |

---

## 3. GEAR Logistics, Procurement & Repair Configuration (`repairConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `baseGearPriceCredits` | `number` | `10000` | **APPROVED DEFAULT** | Baseline credit cost to procure replacement GEAR chassis. |
| `pilotRecoveryTotalDays` | `number` | `10` | **APPROVED DEFAULT** | Sequential days for psychological recovery (3d) + procurement (2d) + familiarization (5d). |
| `repairNormalizationUnit` | `string` | `"HP_PER_DAY"` | **APPROVED DEFAULT** | Mandatory metric for all strategic repair. |
| `baseInstallationRepairHpDay`| `number` | `100` | **APPROVED DEFAULT** | Local facility baseline daily repair throughput. |
| `globalTechGroupSize` | `number` | `100` | **CONCEPTUAL EXAMPLE** | Number of national technicians required per bonus tier. |
| `globalTechBonusHpDay` | `number` | `50` | **CONCEPTUAL EXAMPLE** | $+50$ HP/day per global technician group. |
| `localTechGroupSize` | `number` | `100` | **CONCEPTUAL EXAMPLE** | Number of local technicians required per bonus tier. |
| `localTechBonusHpDay` | `number` | `20` | **CONCEPTUAL EXAMPLE** | $+20$ HP/day per local technician group. |
| `distanceDecayMode` | `"FIXED" \| "BASE_RATIO"` | `"BASE_RATIO"` | **APPROVED DEFAULT** | Method of attenuating global repair contribution over hyperlanes. |
| `distanceDecayRatePerHop` | `number` | `0.20` | **CONCEPTUAL EXAMPLE** | 20% loss per hyperlane hop; clamped at $\ge 0$. |

---

## 4. National Personnel Pools & Training Configuration (`personnelConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `regularForcesInitialMax` | `number` | `1000000` | **APPROVED DEFAULT** | Regular Forces initial maximum ceiling. |
| `regularForcesAnnualGrowth`| `number` | `100000` | **APPROVED DEFAULT** | Regular Forces annual capacity growth (+100k/yr). |
| `auxiliaryForcesInitialMax`| `number` | `200000` | **APPROVED DEFAULT** | Auxiliary Forces initial maximum ceiling. |
| `auxiliaryForcesAnnualGrowth`| `number` | `20000` | **APPROVED DEFAULT** | Auxiliary Forces annual capacity growth (+20k/yr). |
| `logisticsWorkforceInitialMax`| `number`| `100000` | **APPROVED DEFAULT** | Logistics Workforce initial maximum ceiling. |
| `logisticsWorkforceAnnualGrowth`| `number`| `10000` | **APPROVED DEFAULT** | Logistics Workforce annual capacity growth (+10k/yr). |
| `capacityGrowthInterval` | `"DAY" \| "MONTH" \| "YEAR"` | `"YEAR"` | **APPROVED DEFAULT** | Cadence for pool capacity expansion evaluations. |
| `trainingCapPolicy` | `string` | `"FINISH_CURRENT"` | **APPROVED DEFAULT** | Enrolled cohorts finish curricula; new enrollment pauses at projected cap. |
| `freeskaAcademyCapacity` | `number` | `100000` | **APPROVED DEFAULT** | FREESKA Officer Academy maximum cadet capacity. |
| `freeskaProgramDurationYears` | `number` | `5` | **APPROVED DEFAULT** | Standard 5-year curriculum duration. |
| `technicalVocationalDurationYears` | `number` | `5` | **APPROVED DEFAULT** | Standard 5-year technical apprenticeship duration. |

---

## 5. National Economy & Tax Configuration (`economyConfig`)

| Configuration Key | Type | Default Value | Status | Purpose / Rule |
| :--- | :--- | :--- | :--- | :--- |
| `regularPersonnelUpkeepCoeff` | `number` | `2.0` | **APPROVED DEFAULT** | Credits per active regular soldier per cycle. |
| `auxiliaryPersonnelUpkeepCoeff` | `number` | `1.0` | **APPROVED DEFAULT** | Credits per active auxiliary soldier per cycle. |
| `logisticsPersonnelUpkeepCoeff` | `number` | `0.5` | **APPROVED DEFAULT** | Credits per active logistics technician per cycle. |
| `taxCycleIntervalValue` | `number` | `1` | **APPROVED DEFAULT** | Fiscal assessment cycle value. |
| `taxCycleIntervalUnit` | `"DAY" \| "MONTH" \| "YEAR"` | `"YEAR"` | **APPROVED DEFAULT** | Standard annual tax assessment cycle. |
| `shortTaxCycleTestingDays` | `number` | `2` | **APPROVED DEFAULT** | Rapid testing cycle interval (2 days). |
