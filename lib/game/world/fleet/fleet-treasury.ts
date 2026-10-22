/**
 * STARFRONT WORLD — Fleet Treasury & Financial Independence Engine (Phase 7.4)
 *
 * Implements:
 * 1. Independent Fleet Treasury (FleetTreasuryState):
 *    - credits: Standard trade and operational currency
 *    - supplyCredits: National sovereign strategic line of credit
 *    - ledgerHistory: Immutable audit journal trail
 * 2. Income streams:
 *    - Mission bounties, prize money, salvage awards, commerce security contracts, subsidies
 * 3. Operational expenses:
 *    - Crew payroll, maintenance dockage, fuel & ammunition
 * 4. Deficit handling & Austere Mode trigger:
 *    - If payroll/expenses fail for consecutive cycles -> triggers AUSTERE_MODE & morale collapse
 */

export type FleetTransactionType =
  | "PAYROLL"
  | "MISSION_BOUNTY"
  | "SALVAGE_PRIZE"
  | "ESCORT_CONTRACT"
  | "MAINTENANCE_DOCKAGE"
  | "SUPPLY_PURCHASE"
  | "NATIONAL_SUBSIDY"
  | "DIRECT_TRANSFER"
  | "CONCESSIONAL_LOAN"
  | "FRAME_CONVERSION"

export interface FleetLedgerEntry {
  id: string
  gameDay: number
  type: FleetTransactionType
  amountCredits: number
  amountSupplyCredits?: number
  balanceAfterCredits: number
  balanceAfterSupplyCredits: number
  description: string
  referenceId?: string
}

export interface FleetTreasuryState {
  credits: number
  supplyCredits: number
  consecutiveDeficitCycles: number
  isAustereMode: boolean
  totalCreditsEarned: number
  totalCreditsSpent: number
  ledgerHistory: FleetLedgerEntry[]
}

/**
 * Creates an initial independent treasury for a Fleet
 */
export function createFleetTreasury(
  initialCredits = 5000,
  initialSupplyCredits = 1000
): FleetTreasuryState {
  return {
    credits: Math.max(0, initialCredits),
    supplyCredits: Math.max(0, initialSupplyCredits),
    consecutiveDeficitCycles: 0,
    isAustereMode: false,
    totalCreditsEarned: initialCredits,
    totalCreditsSpent: 0,
    ledgerHistory: [
      {
        id: `tx_init_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gameDay: 1,
        type: "DIRECT_TRANSFER",
        amountCredits: initialCredits,
        amountSupplyCredits: initialSupplyCredits,
        balanceAfterCredits: initialCredits,
        balanceAfterSupplyCredits: initialSupplyCredits,
        description: "Initial Fleet Commissioning Endowment",
      },
    ],
  }
}

/**
 * Deposits credits into the fleet treasury and appends audit log
 */
export function depositFleetCredits(
  treasury: FleetTreasuryState,
  amount: number,
  type: FleetTransactionType,
  description: string,
  gameDay: number,
  referenceId?: string
): boolean {
  if (amount <= 0) return false

  treasury.credits += amount
  treasury.totalCreditsEarned += amount

  treasury.ledgerHistory.push({
    id: `tx_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    gameDay,
    type,
    amountCredits: amount,
    amountSupplyCredits: 0,
    balanceAfterCredits: treasury.credits,
    balanceAfterSupplyCredits: treasury.supplyCredits,
    description,
    referenceId,
  })

  // Truncate history if exceeds 500 entries to maintain memory performance
  if (treasury.ledgerHistory.length > 500) {
    treasury.ledgerHistory = treasury.ledgerHistory.slice(-500)
  }

  return true
}

/**
 * Withdraws credits from the fleet treasury with strict balance check
 */
export function withdrawFleetCredits(
  treasury: FleetTreasuryState,
  amount: number,
  type: FleetTransactionType,
  description: string,
  gameDay: number,
  referenceId?: string,
  allowSupplyCreditsFallback = false
): boolean {
  if (amount <= 0) return false

  if (treasury.credits >= amount) {
    treasury.credits -= amount
    treasury.totalCreditsSpent += amount

    treasury.ledgerHistory.push({
      id: `tx_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gameDay,
      type,
      amountCredits: -amount,
      amountSupplyCredits: 0,
      balanceAfterCredits: treasury.credits,
      balanceAfterSupplyCredits: treasury.supplyCredits,
      description,
      referenceId,
    })
    return true
  }

  // Check if supply credits fallback is allowed
  if (allowSupplyCreditsFallback && (treasury.credits + treasury.supplyCredits) >= amount) {
    const creditsUsed = treasury.credits
    const supplyUsed = amount - creditsUsed

    treasury.credits = 0
    treasury.supplyCredits -= supplyUsed
    treasury.totalCreditsSpent += amount

    treasury.ledgerHistory.push({
      id: `tx_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gameDay,
      type,
      amountCredits: -creditsUsed,
      amountSupplyCredits: -supplyUsed,
      balanceAfterCredits: 0,
      balanceAfterSupplyCredits: treasury.supplyCredits,
      description: `${description} (Using Sovereign Supply Credit Reserve)`,
      referenceId,
    })
    return true
  }

  return false
}

/**
 * Processes Crew Payroll for the fleet
 * If funds are insufficient:
 * - Increments consecutiveDeficitCycles
 * - If consecutiveDeficitCycles >= 3: automatically sets isAustereMode = true
 */
export function processFleetPayroll(
  treasury: FleetTreasuryState,
  assignedCrewCount: number,
  idleCrewCount: number,
  gameDay: number,
  creditCostPerAssignedCrew = 2,
  creditCostPerIdleCrew = 1
): {
  success: boolean
  totalCost: number
  consecutiveDeficitCycles: number
  isAustereMode: boolean
} {
  const totalCost = (assignedCrewCount * creditCostPerAssignedCrew) + (idleCrewCount * creditCostPerIdleCrew)

  if (totalCost === 0) {
    return {
      success: true,
      totalCost: 0,
      consecutiveDeficitCycles: treasury.consecutiveDeficitCycles,
      isAustereMode: treasury.isAustereMode,
    }
  }

  if (treasury.credits >= totalCost) {
    treasury.credits -= totalCost
    treasury.totalCreditsSpent += totalCost
    treasury.consecutiveDeficitCycles = 0
    treasury.isAustereMode = false

    treasury.ledgerHistory.push({
      id: `tx_pay_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gameDay,
      type: "PAYROLL",
      amountCredits: -totalCost,
      amountSupplyCredits: 0,
      balanceAfterCredits: treasury.credits,
      balanceAfterSupplyCredits: treasury.supplyCredits,
      description: `Regular Crew Payroll: ${assignedCrewCount} assigned, ${idleCrewCount} idle personnel`,
    })

    return {
      success: true,
      totalCost,
      consecutiveDeficitCycles: 0,
      isAustereMode: false,
    }
  }

  // Deficit handling
  treasury.consecutiveDeficitCycles += 1
  if (treasury.consecutiveDeficitCycles >= 3) {
    treasury.isAustereMode = true
  }

  treasury.ledgerHistory.push({
    id: `tx_deficit_${gameDay}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    gameDay,
    type: "PAYROLL",
    amountCredits: 0,
    amountSupplyCredits: 0,
    balanceAfterCredits: treasury.credits,
    balanceAfterSupplyCredits: treasury.supplyCredits,
    description: `DEFICIT: Insufficient funds for payroll (Owed: ${totalCost}, Bal: ${treasury.credits}). Deficit cycle #${treasury.consecutiveDeficitCycles}`,
  })

  return {
    success: false,
    totalCost,
    consecutiveDeficitCycles: treasury.consecutiveDeficitCycles,
    isAustereMode: treasury.isAustereMode,
  }
}
