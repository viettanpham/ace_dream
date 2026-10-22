# STARFRONT WORLD — National Personnel & Training Architecture

Status: DESIGN SOURCE OF TRUTH
Related Phases: 6.36, 6.37, 6.38, 6.41

## Read With
- ../WORLD_ROADMAP_6_32_6_45.md
- WORLD_SYSTEM_INVARIANTS.md
- WORLD_ADMINCP_CONFIG_REFERENCE.md

## Scope
This document defines approved and planned architectural rules for National Population, Personnel Pools, FREESKA Officer Academy, NEWHORIZON Facility, and Technical Careers.

## 1. National Population Model
- National Total Population across VSS.
- Controlled Territory Distribution.
- Uncontrolled sectors contribute 0 to talent and workforce pools.

## 2. Three Personnel Pools
- **Regular Forces**: Standing military, fleets, base garrisons. Initial max: 1,000,000. Annual growth: +100,000/yr.
- **Auxiliary Forces**: Reserves, mercenaries, qualified auxiliaries. Initial max: 200,000. Annual growth: +20,000/yr.
- **Logistics Workforce**: Repair technicians, mechanics, maintenance specialists. Initial max: 100,000. Annual growth: +10,000/yr.
- Configurable interval: DAY, MONTH, YEAR (Default).
- Capacity growth expands maximum ceiling only; does not auto-spawn troops.

## 3. Academies & Career Paths
- FREESKA: 100,000 capacity, 5-year cohort education.
- NEWHORIZON: Active military deployment facility (30d drills, 10d trials, 3d gear, 10d tactics).
- Technical Careers: 5-year apprenticeship (Repair Tech, Mechanic, Avionics, Manufacturing).
- Training Cap Policy: FINISH_CURRENT (Approved Default).
