import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  DEFAULT_GEAR_V2_WEIGHT_CONFIG,
  GEAR_V2_CLASS_IDS,
  GEAR_V2_ENGINE_VARIANTS,
  GEAR_V2_MAX_AUXILIARY_SLOTS,
  GEAR_V2_MAX_PHYSICAL_SLOTS,
  GEAR_V2_PHYSICAL_SLOT_DEFINITIONS,
  GEAR_V2_SLOT_GROUP_DEFINITIONS,
  GearV2WeightError,
  calculateEngineBonusGrams,
  calculateExactLoadRatioBps,
  calculateLoadoutWeight,
  calculateMaxLoadCapacityGrams,
  classifyLoadStatus,
  validateConfirmLoadoutWeight,
  validateDraftLoadoutWeight,
  type GearV2ClassId,
  type GearV2EngineVariant,
  type GearV2LoadoutSlotsMap,
  type GearV2WeightConfig,
} from "../lib/game/v2/gear"
import { STARFRONT_GEAR_DEFS } from "../lib/game/data"
import { INITIAL_STARFRONT_PROGRESSION, calculateTotalGearStats } from "../lib/game/progression"

describe("GEAR V2 P1 — Weight Engine (Pure TypeScript)", () => {
  describe("0. Canonical Slot & Group Structure", () => {
    it("Defines exactly 10 physical slots across 7 slot groups with Auxiliary max 4", () => {
      assert.equal(GEAR_V2_PHYSICAL_SLOT_DEFINITIONS.length, 10)
      assert.equal(GEAR_V2_MAX_PHYSICAL_SLOTS, 10)
      assert.equal(GEAR_V2_SLOT_GROUP_DEFINITIONS.length, 7)
      assert.equal(GEAR_V2_MAX_AUXILIARY_SLOTS, 4)

      const auxGroup = GEAR_V2_SLOT_GROUP_DEFINITIONS.find((g) => g.groupId === "AUXILIARY")
      assert.ok(auxGroup)
      assert.equal(auxGroup.maxSlots, 4)
      assert.equal(auxGroup.slotIds.length, 4)
    })
  })

  describe("1. Six Classes × Three Engine Variants (18 Combinations)", () => {
    const expectedClassBonuses: Record<GearV2ClassId, number> = {
      "A-GEAR": 1_600_000,
      "B-GEAR": 1_500_000,
      "I-GEAR": 900_000,
      "M-GEAR": 1_200_000,
      "R-GEAR": 1_000_000,
      "G-GEAR": 2_000_000,
    }
    const expectedEngineModifiers: Record<GearV2EngineVariant, number> = {
      SILENT: 200_000,
      BASE: 0,
      JET: -200_000,
    }

    it("Computes exact integer gram capacities for all 6 classes × 3 variants (long and short class codes)", () => {
      for (const cls of GEAR_V2_CLASS_IDS) {
        const shortCode = cls.split("-")[0]
        for (const variant of GEAR_V2_ENGINE_VARIANTS) {
          const expected =
            3_000_000 + expectedClassBonuses[cls] + expectedEngineModifiers[variant]

          assert.equal(calculateEngineBonusGrams(variant), expectedEngineModifiers[variant])
          assert.equal(
            calculateMaxLoadCapacityGrams({ gearClass: cls, engineVariant: variant }),
            expected
          )
          assert.equal(
            calculateMaxLoadCapacityGrams({ gearClass: shortCode, engineVariant: variant }),
            expected
          )
        }
      }
    })
  })

  describe("2. Explicit Capacity Override Precedence", () => {
    it("Replaces sharedBase + classBonus + engineModifier completely when override is provided", () => {
      const cap = calculateMaxLoadCapacityGrams({
        gearClass: "G-GEAR",
        engineVariant: "SILENT",
        engineCapacityOverrideGrams: 5_555_000,
      })
      assert.equal(cap, 5_555_000)

      const loadout = calculateLoadoutWeight({
        gearClass: "A-GEAR",
        engineVariant: "JET",
        engineCapacityOverrideGrams: 1_000_000,
        slots: {
          engine: { equipmentId: "eng_custom", weightGrams: 500_000 },
        },
      })
      assert.equal(loadout.usedCapacityOverride, true)
      assert.equal(loadout.maxLoadGrams, 1_000_000)
      assert.equal(loadout.loadRatioBps, 5_000)
      assert.equal(loadout.loadStatus, "NORMAL")
    })
  })

  describe("3. Empty & Partially Populated Loadouts", () => {
    it("Handles empty loadout with 0 weight, 0 bps, NORMAL status", () => {
      const res = calculateLoadoutWeight({
        gearClass: "I-GEAR",
        engineVariant: "BASE",
        slots: {},
      })
      assert.equal(res.maxLoadGrams, 3_900_000)
      assert.equal(res.totalWeightGrams, 0)
      assert.equal(res.remainingCapacityGrams, 3_900_000)
      assert.equal(res.excessWeightGrams, 0)
      assert.equal(res.loadRatioBps, 0)
      assert.equal(res.loadStatus, "NORMAL")
      assert.equal(res.occupiedSlotCount, 0)
    })

    it("Handles partially populated loadout with null/undefined slots ignored", () => {
      const res = calculateLoadoutWeight({
        gearClass: "M-GEAR",
        engineVariant: "SILENT",
        slots: {
          armor: { equipmentId: "arm_01", weightGrams: 800_000 },
          engine: { equipmentId: "eng_01", weightGrams: 600_000 },
          cpu: null,
          radar_sensor: undefined,
        },
      })
      assert.equal(res.maxLoadGrams, 4_400_000)
      assert.equal(res.totalWeightGrams, 1_400_000)
      assert.equal(res.occupiedSlotCount, 2)
      assert.equal(res.auxiliarySlotCount, 0)
    })
  })

  describe("4. All Ten Physical Slots Occupied", () => {
    it("Sums all 10 physical slots accurately", () => {
      const fullSlots: GearV2LoadoutSlotsMap = {
        armor: { equipmentId: "eq_armor", weightGrams: 900_000 },
        engine: { equipmentId: "eq_engine", weightGrams: 650_000 },
        cpu: { equipmentId: "eq_cpu", weightGrams: 120_000 },
        radar_sensor: { equipmentId: "eq_radar", weightGrams: 150_000 },
        standard_weapon: { equipmentId: "eq_std_wpn", weightGrams: 700_000 },
        advanced_weapon: { equipmentId: "eq_adv_wpn", weightGrams: 950_000 },
        auxiliary_1: { equipmentId: "eq_aux_1", weightGrams: 100_000 },
        auxiliary_2: { equipmentId: "eq_aux_2", weightGrams: 110_000 },
        auxiliary_3: { equipmentId: "eq_aux_3", weightGrams: 120_000 },
        auxiliary_4: { equipmentId: "eq_aux_4", weightGrams: 130_000 },
      }
      const res = calculateLoadoutWeight({
        gearClass: "G-GEAR",
        engineVariant: "BASE",
        slots: fullSlots,
      })
      assert.equal(res.maxLoadGrams, 5_000_000)
      assert.equal(res.totalWeightGrams, 3_930_000)
      assert.equal(res.occupiedSlotCount, 10)
      assert.equal(res.auxiliarySlotCount, 4)
      assert.equal(res.loadRatioBps, 7_860)
      assert.equal(res.loadStatus, "HEAVY")
    })
  })

  describe("5. Auxiliary Maximum Four", () => {
    it("Allows 4 auxiliary items and rejects a 5th or unknown auxiliary slot", () => {
      const fourAux = calculateLoadoutWeight({
        gearClass: "B-GEAR",
        engineVariant: "BASE",
        entries: [
          { slotId: "auxiliary", item: { equipmentId: "aux_a", weightGrams: 100_000 } },
          { slotId: "auxiliary", item: { equipmentId: "aux_b", weightGrams: 100_000 } },
          { slotId: "auxiliary", item: { equipmentId: "aux_c", weightGrams: 100_000 } },
          { slotId: "auxiliary", item: { equipmentId: "aux_d", weightGrams: 100_000 } },
        ],
      })
      assert.equal(fourAux.auxiliarySlotCount, 4)
      assert.equal(fourAux.totalWeightGrams, 400_000)

      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "B-GEAR",
            engineVariant: "BASE",
            entries: [
              { slotId: "auxiliary", item: { equipmentId: "aux_a", weightGrams: 100_000 } },
              { slotId: "auxiliary", item: { equipmentId: "aux_b", weightGrams: 100_000 } },
              { slotId: "auxiliary", item: { equipmentId: "aux_c", weightGrams: 100_000 } },
              { slotId: "auxiliary", item: { equipmentId: "aux_d", weightGrams: 100_000 } },
              { slotId: "auxiliary", item: { equipmentId: "aux_e", weightGrams: 100_000 } },
            ],
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "AUXILIARY_LIMIT_EXCEEDED"
      )

      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "B-GEAR",
            engineVariant: "BASE",
            entries: [
              { slotId: "auxiliary_5", item: { equipmentId: "aux_5", weightGrams: 100_000 } },
            ],
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "UNKNOWN_SLOT_ID"
      )
    })
  })

  describe("6. Engine Mass Counted Once", () => {
    it("Counts equipped engine mass once even if derivedEngineWeightGrams metadata is present", () => {
      const res = calculateLoadoutWeight({
        gearClass: "R-GEAR",
        engineVariant: "BASE",
        slots: {
          engine: {
            equipmentId: "eng_stealth_01",
            instanceId: "inst_eng_1",
            weightGrams: 750_000,
            derivedEngineWeightGrams: 750_000,
          },
        },
      })
      assert.equal(res.totalWeightGrams, 750_000)
      assert.equal(res.perSlotWeightGrams.engine, 750_000)
    })

    it("Rejects equipping the same physical instanceId in two slots", () => {
      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "R-GEAR",
            engineVariant: "BASE",
            slots: {
              engine: { equipmentId: "eng_1", instanceId: "same_inst", weightGrams: 500_000 },
              cpu: { equipmentId: "eng_1", instanceId: "same_inst", weightGrams: 500_000 },
            },
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "DUPLICATE_INSTANCE_ID"
      )
    })
  })

  describe("7. Exact 70%, 80%, 90% and 100% Threshold Boundaries", () => {
    it("Classifies exact bps thresholds and 1-gram over-100% boundary without float drift", () => {
      assert.equal(classifyLoadStatus(0), "NORMAL")
      assert.equal(classifyLoadStatus(6_999), "NORMAL")
      assert.equal(classifyLoadStatus(7_000), "HEAVY")
      assert.equal(classifyLoadStatus(7_999), "HEAVY")
      assert.equal(classifyLoadStatus(8_000), "OVERLOADED")
      assert.equal(classifyLoadStatus(8_999), "OVERLOADED")
      assert.equal(classifyLoadStatus(9_000), "CRITICAL")
      assert.equal(classifyLoadStatus(10_000), "CRITICAL")
      assert.equal(classifyLoadStatus(10_001), "EXCESS_LOAD")

      // A-GEAR + BASE capacity = 4_600_000g
      const cap = 4_600_000
      const checkLoad = (grams: number) =>
        calculateLoadoutWeight({
          gearClass: "A-GEAR",
          engineVariant: "BASE",
          slots: { armor: { equipmentId: "test_mass", weightGrams: grams } },
        })

      // 70% of 4_600_000 = 3_220_000
      assert.equal(checkLoad(3_219_999).loadStatus, "NORMAL")
      assert.equal(checkLoad(3_220_000).loadStatus, "HEAVY")

      // 80% of 4_600_000 = 3_680_000
      assert.equal(checkLoad(3_679_999).loadStatus, "HEAVY")
      assert.equal(checkLoad(3_680_000).loadStatus, "OVERLOADED")

      // 90% of 4_600_000 = 4_140_000
      assert.equal(checkLoad(4_139_999).loadStatus, "OVERLOADED")
      assert.equal(checkLoad(4_140_000).loadStatus, "CRITICAL")

      // 100% of 4_600_000 = 4_600_000; 1 gram over MUST be EXCESS_LOAD
      assert.equal(checkLoad(cap).loadRatioBps, 10_000)
      assert.equal(checkLoad(cap).loadStatus, "CRITICAL")

      const oneGramOver = checkLoad(cap + 1)
      assert.equal(oneGramOver.isOverCapacity, true)
      assert.equal(oneGramOver.excessWeightGrams, 1)
      assert.equal(oneGramOver.loadRatioBps, 10_001)
      assert.equal(oneGramOver.loadStatus, "EXCESS_LOAD")

      // Direct BigInt ratio check near huge safe integers
      const hugeRatio = calculateExactLoadRatioBps(9_007_199_254_740_001, 9_007_199_254_740_000)
      assert.equal(hugeRatio, 10_001)
      assert.equal(classifyLoadStatus(hugeRatio), "EXCESS_LOAD")
    })
  })

  describe("8 & 9. Draft vs Confirm Weight Validation & OD-07 Unresolved Boundary", () => {
    const overCapacityInput = {
      gearClass: "I-GEAR",
      engineVariant: "JET", // 3_000_000 + 900_000 - 200_000 = 3_700_000
      slots: {
        armor: { equipmentId: "heavy_armor", weightGrams: 2_000_000 },
        standard_weapon: { equipmentId: "heavy_gun", weightGrams: 1_700_001 },
      },
    }

    it("Draft permits overcapacity (>100%) without auto-unequipping", () => {
      const draft = validateDraftLoadoutWeight(overCapacityInput)
      assert.equal(draft.valid, true)
      assert.ok(draft.calculation)
      assert.equal(draft.calculation.isOverCapacity, true)
      assert.equal(draft.calculation.loadStatus, "EXCESS_LOAD")
      assert.equal(draft.calculation.occupiedSlotCount, 2)
      assert.ok(draft.warnings.includes("OVER_CAPACITY_DRAFT_ALLOWED"))
    })

    it("Confirm rejects overcapacity (>100%) without auto-unequipping and reports OD-07 UNRESOLVED when no policy injected", () => {
      const confirmOver = validateConfirmLoadoutWeight(overCapacityInput)
      assert.equal(confirmOver.valid, false)
      assert.equal(confirmOver.od07MandatorySlotStatus, "UNRESOLVED")
      assert.equal(confirmOver.confirmReadyWithMandatorySlots, false)
      assert.ok(
        confirmOver.errors.some((e) => e.code === "EXCESS_LOAD_FORBIDDEN_ON_CONFIRM")
      )
      // Loadout items must not be auto-unequipped
      assert.equal(confirmOver.calculation?.occupiedSlotCount, 2)

      // Within capacity Confirm still marks OD-07 UNRESOLVED (does not invent mandatory-slot rules)
      const confirmWithinCap = validateConfirmLoadoutWeight({
        gearClass: "I-GEAR",
        engineVariant: "JET",
        slots: {
          armor: { equipmentId: "light_armor", weightGrams: 1_000_000 },
        },
      })
      assert.equal(confirmWithinCap.valid, true)
      assert.equal(confirmWithinCap.od07MandatorySlotStatus, "UNRESOLVED")
      assert.equal(confirmWithinCap.confirmReadyWithMandatorySlots, false)
      assert.ok(confirmWithinCap.warnings.includes("OD07_MANDATORY_SLOT_RULE_UNRESOLVED"))
    })

    it("Supports injected mandatorySlotIds policy if provided later without hardcoding OD-07", () => {
      const missingMandatory = validateConfirmLoadoutWeight(
        {
          gearClass: "A-GEAR",
          engineVariant: "BASE",
          slots: { armor: { equipmentId: "arm_1", weightGrams: 1_000_000 } },
        },
        DEFAULT_GEAR_V2_WEIGHT_CONFIG,
        { mandatorySlotIds: ["armor", "engine"] }
      )
      assert.equal(missingMandatory.valid, false)
      assert.equal(missingMandatory.od07MandatorySlotStatus, "CHECKED_FROM_INJECTED_POLICY")
      assert.ok(missingMandatory.errors.some((e) => e.code === "MANDATORY_SLOT_UNFILLED"))
    })
  })

  describe("10. Invalid Inputs, Negative Mass, Unsafe Overflow, Duplicate Limits & Unknown Class/Variant", () => {
    it("Rejects float masses, NaN, Infinity, negative masses, and unsafe overflow", () => {
      const badCases = [
        { weightGrams: 123.45, expected: "INVALID_INTEGER" },
        { weightGrams: Number.NaN, expected: "INVALID_INTEGER" },
        { weightGrams: Number.POSITIVE_INFINITY, expected: "INVALID_INTEGER" },
        { weightGrams: -1, expected: "NEGATIVE_MASS" },
      ]

      for (const c of badCases) {
        assert.throws(
          () =>
            calculateLoadoutWeight({
              gearClass: "A-GEAR",
              engineVariant: "BASE",
              slots: { armor: { equipmentId: "bad", weightGrams: c.weightGrams } },
            }),
          (err: unknown) => err instanceof GearV2WeightError && err.code === c.expected
        )
      }

      // Sum overflow beyond Number.MAX_SAFE_INTEGER
      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "G-GEAR",
            engineVariant: "BASE",
            slots: {
              armor: { equipmentId: "huge_1", weightGrams: Number.MAX_SAFE_INTEGER },
              engine: { equipmentId: "huge_2", weightGrams: 1 },
            },
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "UNSAFE_INTEGER_OVERFLOW"
      )
    })

    it("Rejects unknown class, unknown engine variant, and invalid override", () => {
      assert.throws(
        () => calculateMaxLoadCapacityGrams({ gearClass: "Z-GEAR", engineVariant: "BASE" }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "INVALID_GEAR_CLASS"
      )
      assert.throws(
        () => calculateMaxLoadCapacityGrams({ gearClass: "A-GEAR", engineVariant: "WARP" }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "INVALID_ENGINE_VARIANT"
      )
      assert.throws(
        () =>
          calculateMaxLoadCapacityGrams({
            gearClass: "A-GEAR",
            engineVariant: "BASE",
            engineCapacityOverrideGrams: 0,
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "INVALID_CAPACITY"
      )
    })

    it("Enforces explicit maxPerLoadout and uniquenessGroupId when provided", () => {
      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "A-GEAR",
            engineVariant: "BASE",
            slots: {
              auxiliary_1: { equipmentId: "aux_booster", maxPerLoadout: 1, weightGrams: 50_000 },
              auxiliary_2: { equipmentId: "aux_booster", maxPerLoadout: 1, weightGrams: 50_000 },
            },
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "DUPLICATE_OR_OVER_LIMIT"
      )

      assert.throws(
        () =>
          calculateLoadoutWeight({
            gearClass: "A-GEAR",
            engineVariant: "BASE",
            slots: {
              auxiliary_1: {
                equipmentId: "aux_core_mk1",
                uniquenessGroupId: "grp_core_stabilizer",
                weightGrams: 50_000,
              },
              auxiliary_2: {
                equipmentId: "aux_core_mk2",
                uniquenessGroupId: "grp_core_stabilizer",
                weightGrams: 60_000,
              },
            },
          }),
        (err: unknown) => err instanceof GearV2WeightError && err.code === "DUPLICATE_OR_OVER_LIMIT"
      )
    })
  })

  describe("11. Deterministic Repeated Calculations & Injectable Config", () => {
    it("Produces identical results across repeated invocations and respects custom config injection", () => {
      const input = {
        gearClass: "M-GEAR",
        engineVariant: "SILENT",
        slots: {
          armor: { equipmentId: "a1", weightGrams: 1_500_000 },
          engine: { equipmentId: "e1", weightGrams: 800_000 },
        },
      }
      const snapshot = JSON.stringify(input)
      const first = calculateLoadoutWeight(input)
      const second = calculateLoadoutWeight(input)
      assert.deepEqual(first, second)
      assert.equal(JSON.stringify(input), snapshot)

      const customConfig: GearV2WeightConfig = {
        ...DEFAULT_GEAR_V2_WEIGHT_CONFIG,
        sharedBaseGrams: 2_000_000,
      }
      const customRes = calculateLoadoutWeight(input, customConfig)
      assert.equal(customRes.maxLoadGrams, 3_400_000)
    })
  })

  describe("12. No GEAR V1 Regressions", () => {
    it("Preserves V1 3-gear definitions and stat calculation untouched", () => {
      assert.deepEqual(Object.keys(STARFRONT_GEAR_DEFS), ["vanguard", "falcon", "aegis"])
      const v1Stats = calculateTotalGearStats(
        INITIAL_STARFRONT_PROGRESSION.activeGearId,
        INITIAL_STARFRONT_PROGRESSION.level,
        INITIAL_STARFRONT_PROGRESSION.inventory,
        INITIAL_STARFRONT_PROGRESSION.equipped
      )
      assert.ok(v1Stats.total.hp > 0)
      assert.ok(v1Stats.total.attack > 0)
    })
  })
})
