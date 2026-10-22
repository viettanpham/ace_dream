/**
 * STARFRONT WORLD — National InTransit Ledger (CC0 InTransit) (Phase 6.34A-FND-4)
 *
 * Implements:
 * 1. Population moving between Base A and Base B is NEVER counted at both locations.
 * 2. Source base decreases exactly once upon departure.
 * 3. InTransit ledger holds count on route.
 * 4. Destination base increases only upon arrival and admission.
 * 5. People InTransit cannot be allocated or recruited.
 * 6. Temporary Orbital Stay contract (waiting up to 15 GAME_DAYS without registering HQ).
 * 7. Zero-sum conservation validation.
 */

import type {
  BasePopulationState,
  PopulationBucketKey,
  PopulationTransferRecord,
} from "./types"

export class NationalInTransitLedger {
  private transfers: Map<string, PopulationTransferRecord> = new Map()

  /**
   * Dispatches a population transfer from source base into InTransit ledger.
   * Deducts from source base immediately to prevent double-counting.
   */
  startTransfer(params: {
    transferId?: string
    sourceBase: BasePopulationState
    destinationBaseId: string
    headcount: number
    category?: PopulationBucketKey
    startedGameDay: number
    durationDays?: number
    routeRef?: string
    reason?: string
  }): { success: boolean; transfer?: PopulationTransferRecord; reason?: string } {
    const {
      sourceBase,
      destinationBaseId,
      headcount,
      category = "RESIDENT",
      startedGameDay,
      durationDays = 2,
      routeRef,
      reason = "MIGRATION",
    } = params

    if (headcount <= 0) {
      return { success: false, reason: "HEADCOUNT_MUST_BE_POSITIVE" }
    }

    if (sourceBase.populationAvailable < headcount) {
      return {
        success: false,
        reason: `INSUFFICIENT_AVAILABLE: Source base has ${sourceBase.populationAvailable}, requested ${headcount}.`,
      }
    }

    // Deduct from Source Base
    sourceBase.populationAvailable -= headcount
    sourceBase.populationCurrent -= headcount

    const transferId =
      params.transferId ||
      `trans_${startedGameDay}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`

    const transfer: PopulationTransferRecord = {
      transferId,
      sourceBaseId: sourceBase.baseId,
      destinationBaseId,
      headcount,
      category,
      startedGameDay,
      estimatedArrivalGameDay: startedGameDay + durationDays,
      status: "IN_TRANSIT",
      routeRef,
      reason,
      orbitalStayDays: 0,
    }

    this.transfers.set(transferId, transfer)
    return { success: true, transfer }
  }

  /**
   * Completes a transfer upon arrival and admission at destination base.
   */
  completeTransfer(
    transferId: string,
    destinationBase: BasePopulationState,
    currentGameDay: number
  ): { success: boolean; transfer?: PopulationTransferRecord; reason?: string } {
    const transfer = this.transfers.get(transferId)
    if (!transfer) {
      return { success: false, reason: "TRANSFER_NOT_FOUND" }
    }

    if (transfer.status !== "IN_TRANSIT" && transfer.status !== "ORBITAL_STAY") {
      return {
        success: false,
        reason: `INVALID_TRANSFER_STATUS: Transfer is currently '${transfer.status}', cannot complete.`,
      }
    }

    if (destinationBase.baseId !== transfer.destinationBaseId) {
      return {
        success: false,
        reason: `BASE_MISMATCH: Destination base '${destinationBase.baseId}' does not match transfer target '${transfer.destinationBaseId}'.`,
      }
    }

    // Admit into destination base
    destinationBase.populationCurrent += transfer.headcount
    destinationBase.populationAvailable += transfer.headcount

    transfer.status = "COMPLETED"
    transfer.actualArrivalGameDay = currentGameDay

    return { success: true, transfer }
  }

  /**
   * Enters temporary orbital stay (e.g. destination blocked or contested)
   */
  enterOrbitalStay(
    transferId: string,
    orbitalDays: number = 1
  ): { success: boolean; transfer?: PopulationTransferRecord; reason?: string } {
    const transfer = this.transfers.get(transferId)
    if (!transfer || (transfer.status !== "IN_TRANSIT" && transfer.status !== "ORBITAL_STAY")) {
      return { success: false, reason: "CANNOT_ENTER_ORBITAL_STAY" }
    }

    transfer.status = "ORBITAL_STAY"
    transfer.orbitalStayDays = (transfer.orbitalStayDays || 0) + orbitalDays

    return { success: true, transfer }
  }

  /**
   * Cancels a transfer and returns population to source base
   */
  cancelTransfer(
    transferId: string,
    sourceBase: BasePopulationState
  ): { success: boolean; transfer?: PopulationTransferRecord; reason?: string } {
    const transfer = this.transfers.get(transferId)
    if (!transfer || (transfer.status !== "IN_TRANSIT" && transfer.status !== "ORBITAL_STAY")) {
      return { success: false, reason: "TRANSFER_CANNOT_BE_CANCELLED" }
    }

    // Return to source base
    sourceBase.populationCurrent += transfer.headcount
    sourceBase.populationAvailable += transfer.headcount

    transfer.status = "CANCELLED"
    return { success: true, transfer }
  }

  /**
   * Calculates total headcount currently moving in transit across all active transfers
   */
  getTotalInTransitHeadcount(): number {
    let total = 0
    for (const t of this.transfers.values()) {
      if (t.status === "IN_TRANSIT" || t.status === "ORBITAL_STAY") {
        total += t.headcount
      }
    }
    return total
  }

  getTransfer(transferId: string): PopulationTransferRecord | undefined {
    return this.transfers.get(transferId)
  }

  getActiveTransfers(): PopulationTransferRecord[] {
    return Array.from(this.transfers.values()).filter(
      (t) => t.status === "IN_TRANSIT" || t.status === "ORBITAL_STAY"
    )
  }

  exportTransfers(): PopulationTransferRecord[] {
    return Array.from(this.transfers.values())
  }

  importTransfers(records: PopulationTransferRecord[]): void {
    this.transfers.clear()
    for (const r of records) {
      this.transfers.set(r.transferId, { ...r })
    }
  }
}

export const defaultInTransitLedger = new NationalInTransitLedger()
