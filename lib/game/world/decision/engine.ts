/**
 * STARFRONT WORLD — Shared Decision Engine (Phase 6.34A-FND-3)
 *
 * Domain-agnostic runtime implementation:
 * - Minimal 4-state lifecycle: PENDING, APPROVED, REJECTED, INVALIDATED
 * - Timeout handling in GAME_DAY (no wall-clock dependency)
 * - Fallback policies: AI_REEVALUATE, KEEP_PENDING, AUTO_REJECT
 * - Authoritative DecisionSource tracking (COMMANDER vs AI_TIMEOUT vs INVALIDATED)
 * - Single active pending decision per scope (MaxActivePendingPerScope = 1)
 * - Scope conflict resolution: KEEP_EXISTING, REPLACE_EXISTING, REJECT_NEW
 * - Invalidation semantics (SUPERSEDED_BY_NEW_DECISION, TARGET_NOT_FOUND, etc.)
 * - Hub notification projection contract
 * - Full state export/import persistence
 */

import type {
  DecisionEngineState,
  DecisionFallbackPolicy,
  DecisionHistoryRecord,
  DecisionPriority,
  DecisionScopeConflictResolution,
  DecisionSource,
  DecisionStatus,
  DecisionValidator,
  GenericEntityRef,
  GenericPayloadRef,
  HubDecisionNotification,
  SharedDecision,
} from "./types"

export interface CreateDecisionParams {
  decisionId?: string
  decisionType: string
  title: string
  summary: string
  createdGameDay: number
  timeoutGameDays?: number
  fallbackPolicy?: DecisionFallbackPolicy
  contextRef: GenericEntityRef
  payloadRef?: GenericPayloadRef
  ownerRef?: GenericEntityRef
  eventId?: string
  decisionScopeKey?: string
  priority?: DecisionPriority
  tags?: string[]
  auditFlags?: string[]
  reasonCodes?: string[]
  relatedRefs?: string[]
  metadata?: Record<string, any>
  scopeConflictResolution?: DecisionScopeConflictResolution
}

export class SharedDecisionEngine {
  private pendingMap: Map<string, SharedDecision> = new Map()
  private scopeIndex: Map<string, string> = new Map() // scopeKey -> decisionId
  private resolvedMap: Map<string, SharedDecision> = new Map()
  private history: DecisionHistoryRecord[] = []

  /**
   * Generates a stable scope key if not provided
   */
  private generateScopeKey(contextRef: GenericEntityRef, decisionType: string): string {
    return `${contextRef.entityType}:${contextRef.entityId}:${decisionType}`
  }

  /**
   * Creates and registers a new decision in PENDING status
   */
  createDecision(params: CreateDecisionParams): {
    success: boolean
    decision?: SharedDecision
    reason?: string
    conflictExistingId?: string
  } {
    const scopeKey =
      params.decisionScopeKey ||
      this.generateScopeKey(params.contextRef, params.decisionType)

    // Check MaxActivePendingPerScope = 1 rule
    if (this.scopeIndex.has(scopeKey)) {
      const existingId = this.scopeIndex.get(scopeKey)!
      const existing = this.pendingMap.get(existingId)

      if (existing && existing.status === "PENDING") {
        const conflictPolicy = params.scopeConflictResolution || "REPLACE_EXISTING"

        if (conflictPolicy === "KEEP_EXISTING" || conflictPolicy === "REJECT_NEW") {
          return {
            success: false,
            reason: "CONFLICT_EXISTING_PENDING_DECISION",
            conflictExistingId: existingId,
          }
        }

        if (conflictPolicy === "REPLACE_EXISTING") {
          // Invalidate old decision with SUPERSEDED_BY_NEW_DECISION
          this.invalidate(
            existingId,
            params.createdGameDay,
            "SUPERSEDED_BY_NEW_DECISION",
            ["SUPERSEDED_BY_NEW_DECISION"]
          )
        }
      }
    }

    const decisionId =
      params.decisionId ||
      `dec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    const timeoutAtGameDay =
      params.timeoutGameDays !== undefined && params.timeoutGameDays > 0
        ? params.createdGameDay + params.timeoutGameDays
        : undefined

    const decision: SharedDecision = {
      decisionId,
      decisionType: params.decisionType,
      status: "PENDING",
      createdGameDay: params.createdGameDay,
      timeoutGameDays: params.timeoutGameDays,
      timeoutAtGameDay,
      fallbackPolicy: params.fallbackPolicy || "AI_REEVALUATE",
      contextRef: { ...params.contextRef },
      payloadRef: params.payloadRef ? { ...params.payloadRef } : undefined,
      ownerRef: params.ownerRef ? { ...params.ownerRef } : undefined,
      eventId: params.eventId,
      decisionScopeKey: scopeKey,
      priority: params.priority || "NORMAL",
      title: params.title,
      summary: params.summary,
      tags: params.tags ? [...params.tags] : [],
      auditFlags: params.auditFlags ? [...params.auditFlags] : [],
      reasonCodes: params.reasonCodes ? [...params.reasonCodes] : [],
      relatedRefs: params.relatedRefs ? [...params.relatedRefs] : [],
      metadata: params.metadata ? { ...params.metadata } : undefined,
    }

    this.pendingMap.set(decisionId, decision)
    this.scopeIndex.set(scopeKey, decisionId)

    this.recordHistory({
      id: `hist_${decisionId}_created`,
      decisionId,
      decisionType: decision.decisionType,
      status: "PENDING",
      gameDay: params.createdGameDay,
      contextRef: decision.contextRef,
      summary: `Created pending decision: ${decision.title}`,
      reasonCodes: ["DECISION_CREATED"],
      timestamp: new Date().toISOString(),
    })

    return { success: true, decision }
  }

  /**
   * Approves a decision (by Commander or AI Timeout fallback)
   */
  approve(
    decisionId: string,
    gameDay: number,
    options?: {
      source?: DecisionSource
      validator?: DecisionValidator
      context?: any
    }
  ): { success: boolean; decision?: SharedDecision; reason?: string } {
    const decision = this.pendingMap.get(decisionId)
    if (!decision || decision.status !== "PENDING") {
      return { success: false, reason: "NOT_FOUND_OR_NOT_PENDING" }
    }

    // Optional domain re-validation hook
    if (options?.validator) {
      const val = options.validator(decision, options.context)
      if (val.status === "INVALID") {
        this.invalidate(
          decisionId,
          gameDay,
          val.reason || "CONTEXT_INVALID_DURING_APPROVAL",
          ["VALIDATION_INVALID"]
        )
        return {
          success: false,
          decision,
          reason: val.reason || "INVALIDATED_DUE_TO_CONTEXT_CHANGE",
        }
      }
      if (val.status === "BLOCKED") {
        return { success: false, reason: val.reason || "APPROVAL_BLOCKED" }
      }
    }

    decision.status = "APPROVED"
    decision.resolvedGameDay = gameDay
    decision.decisionSource = options?.source || "COMMANDER_APPROVED"

    this.finalizeDecision(decision)

    this.recordHistory({
      id: `hist_${decisionId}_approved`,
      decisionId,
      decisionType: decision.decisionType,
      status: "APPROVED",
      decisionSource: decision.decisionSource,
      gameDay,
      contextRef: decision.contextRef,
      summary: `Approved via ${decision.decisionSource}: ${decision.title}`,
      reasonCodes: [...decision.reasonCodes, "APPROVED"],
      timestamp: new Date().toISOString(),
    })

    return { success: true, decision }
  }

  /**
   * Rejects a decision (by Commander or AI Timeout fallback)
   */
  reject(
    decisionId: string,
    gameDay: number,
    options?: {
      source?: DecisionSource
      reasonCodes?: string[]
      summary?: string
    }
  ): { success: boolean; decision?: SharedDecision; reason?: string } {
    const decision = this.pendingMap.get(decisionId)
    if (!decision || decision.status !== "PENDING") {
      return { success: false, reason: "NOT_FOUND_OR_NOT_PENDING" }
    }

    decision.status = "REJECTED"
    decision.resolvedGameDay = gameDay
    decision.decisionSource = options?.source || "COMMANDER_REJECTED"

    if (options?.reasonCodes) {
      decision.reasonCodes.push(...options.reasonCodes)
    }

    this.finalizeDecision(decision)

    this.recordHistory({
      id: `hist_${decisionId}_rejected`,
      decisionId,
      decisionType: decision.decisionType,
      status: "REJECTED",
      decisionSource: decision.decisionSource,
      gameDay,
      contextRef: decision.contextRef,
      summary: options?.summary || `Rejected via ${decision.decisionSource}: ${decision.title}`,
      reasonCodes: [...decision.reasonCodes],
      timestamp: new Date().toISOString(),
    })

    return { success: true, decision }
  }

  /**
   * Invalidates a decision (context destroyed, superseded, expired, or domain cancelled)
   */
  invalidate(
    decisionId: string,
    gameDay: number,
    reason?: string,
    reasonCodes?: string[]
  ): { success: boolean; decision?: SharedDecision; reason?: string } {
    const decision = this.pendingMap.get(decisionId)
    if (!decision) {
      const alreadyResolved = this.resolvedMap.get(decisionId)
      if (alreadyResolved) {
        return { success: false, reason: "ALREADY_RESOLVED", decision: alreadyResolved }
      }
      return { success: false, reason: "NOT_FOUND" }
    }

    decision.status = "INVALIDATED"
    decision.resolvedGameDay = gameDay
    decision.decisionSource = "INVALIDATED"
    decision.invalidationReason = reason || "MANUAL_INVALIDATION"

    if (reasonCodes) {
      decision.reasonCodes.push(...reasonCodes)
    }

    this.finalizeDecision(decision)

    this.recordHistory({
      id: `hist_${decisionId}_invalidated`,
      decisionId,
      decisionType: decision.decisionType,
      status: "INVALIDATED",
      decisionSource: "INVALIDATED",
      gameDay,
      contextRef: decision.contextRef,
      invalidationReason: decision.invalidationReason,
      summary: `Invalidated: ${decision.invalidationReason}`,
      reasonCodes: [...decision.reasonCodes],
      timestamp: new Date().toISOString(),
    })

    return { success: true, decision }
  }

  /**
   * Progresses time simulation by `currentDay`.
   * Evaluates timeouts on pending decisions and applies fallback policy.
   */
  processDayTick(
    currentDay: number,
    validatorProvider?: (decision: SharedDecision) => DecisionValidator | undefined
  ): {
    evaluatedCount: number
    approvedCount: number
    rejectedCount: number
    invalidatedCount: number
    keptPendingCount: number
  } {
    const res = {
      evaluatedCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      invalidatedCount: 0,
      keptPendingCount: 0,
    }

    const pendingList = Array.from(this.pendingMap.values())

    for (const decision of pendingList) {
      // Check if decision has a timeout and reached it
      if (
        decision.timeoutAtGameDay !== undefined &&
        currentDay >= decision.timeoutAtGameDay &&
        decision.status === "PENDING"
      ) {
        res.evaluatedCount++

        switch (decision.fallbackPolicy) {
          case "KEEP_PENDING":
            res.keptPendingCount++
            break

          case "AUTO_REJECT": {
            this.reject(decision.decisionId, currentDay, {
              source: "AI_TIMEOUT_REJECTED",
              reasonCodes: ["TIMEOUT_AUTO_REJECT"],
            })
            res.rejectedCount++
            break
          }

          case "AI_REEVALUATE":
          default: {
            const validator = validatorProvider ? validatorProvider(decision) : undefined
            if (validator) {
              const val = validator(decision)
              if (val.status === "INVALID") {
                this.invalidate(
                  decision.decisionId,
                  currentDay,
                  val.reason || "CONTEXT_NO_LONGER_VALID",
                  ["TIMEOUT_REEVALUATE_INVALID"]
                )
                res.invalidatedCount++
              } else if (val.status === "BLOCKED") {
                this.reject(decision.decisionId, currentDay, {
                  source: "AI_TIMEOUT_REJECTED",
                  reasonCodes: ["REQUIREMENTS_UNMET"],
                })
                res.rejectedCount++
              } else {
                this.approve(decision.decisionId, currentDay, {
                  source: "AI_TIMEOUT_APPROVED",
                })
                res.approvedCount++
              }
            } else {
              // Default fallback when no specific validator: AI approves
              this.approve(decision.decisionId, currentDay, {
                source: "AI_TIMEOUT_APPROVED",
              })
              res.approvedCount++
            }
            break
          }
        }
      }
    }

    return res
  }

  /**
   * Projects a decision into a Hub UI notification representation
   */
  projectToHubNotification(
    decision: SharedDecision,
    currentDay?: number
  ): HubDecisionNotification {
    const isExpiringSoon =
      currentDay !== undefined && decision.timeoutAtGameDay !== undefined
        ? decision.timeoutAtGameDay - currentDay <= 1
        : false

    return {
      decisionId: decision.decisionId,
      decisionType: decision.decisionType,
      title: decision.title,
      summary: decision.summary,
      priority: decision.priority,
      createdGameDay: decision.createdGameDay,
      timeoutAtGameDay: decision.timeoutAtGameDay,
      contextRef: { ...decision.contextRef },
      status: decision.status,
      tags: [...decision.tags],
      isExpiringSoon,
    }
  }

  /**
   * Cleans up pending indices and moves decision to resolved map
   */
  private finalizeDecision(decision: SharedDecision) {
    this.pendingMap.delete(decision.decisionId)
    if (this.scopeIndex.get(decision.decisionScopeKey) === decision.decisionId) {
      this.scopeIndex.delete(decision.decisionScopeKey)
    }
    this.resolvedMap.set(decision.decisionId, decision)
  }

  private recordHistory(record: DecisionHistoryRecord) {
    this.history.push(record)
  }

  // --- Queries ---

  getPendingDecisions(): SharedDecision[] {
    return Array.from(this.pendingMap.values())
  }

  getDecision(decisionId: string): SharedDecision | undefined {
    return this.pendingMap.get(decisionId) || this.resolvedMap.get(decisionId)
  }

  getPendingDecisionByScope(scopeKey: string): SharedDecision | undefined {
    const id = this.scopeIndex.get(scopeKey)
    return id ? this.pendingMap.get(id) : undefined
  }

  getHistory(): DecisionHistoryRecord[] {
    return [...this.history]
  }

  clearHistory(): void {
    this.history = []
  }

  // --- Persistence Export / Import ---

  exportState(): DecisionEngineState {
    return {
      pendingDecisions: Array.from(this.pendingMap.values()),
      history: [...this.history],
    }
  }

  importState(state: DecisionEngineState): void {
    this.pendingMap.clear()
    this.scopeIndex.clear()
    this.resolvedMap.clear()
    this.history = []

    if (Array.isArray(state.pendingDecisions)) {
      for (const d of state.pendingDecisions) {
        if (d && d.decisionId) {
          this.pendingMap.set(d.decisionId, { ...d })
          if (d.decisionScopeKey) {
            this.scopeIndex.set(d.decisionScopeKey, d.decisionId)
          }
        }
      }
    }

    if (Array.isArray(state.history)) {
      this.history = [...state.history]
    }
  }
}

/**
 * Global default decision engine singleton instance
 */
export const defaultDecisionEngine = new SharedDecisionEngine()
