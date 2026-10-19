/**
 * STARFRONT WORLD — Shared Decision & Event Interaction Foundation (Phase 6.34A-FND-3)
 *
 * Domain-agnostic contracts for Decisions, Recommendations, Approvals, Timeouts,
 * Invalidation, Scope Conflicts, Hub Notifications, and Audit Milestones.
 */

export type DecisionStatus =
  | "PENDING"       // Waiting for Commander action or GAME_DAY timeout
  | "APPROVED"      // Approved by Commander or AI fallback
  | "REJECTED"      // Rejected by Commander or AI fallback
  | "INVALIDATED"   // Context changed, superseded, or target destroyed; closed without resolution

export type DecisionFallbackPolicy =
  | "AI_REEVALUATE" // Domain/Owner AI re-evaluates context state -> APPROVE, REJECT, or INVALIDATE
  | "KEEP_PENDING"  // Extends/keeps decision pending despite timeout
  | "AUTO_REJECT"   // Automatically rejects upon timeout

export type DecisionSource =
  | "COMMANDER_APPROVED"
  | "COMMANDER_REJECTED"
  | "AI_TIMEOUT_APPROVED"
  | "AI_TIMEOUT_REJECTED"
  | "INVALIDATED"
  | string

export type DecisionPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"

export type DecisionScopeConflictResolution =
  | "KEEP_EXISTING"    // Keeps the pending decision and rejects the new request
  | "REPLACE_EXISTING" // Invalidates the old decision with SUPERSEDED_BY_NEW_DECISION and queues the new one
  | "REJECT_NEW"       // Rejects the new request

/**
 * Generic reference to any domain entity without serializing raw objects
 */
export interface GenericEntityRef {
  entityType: string // e.g. "SHIP", "BUILDING", "BASE", "PROGRESSION_ENTITY", "PILOT", "MISSION"
  entityId: string
}

/**
 * Generic reference to optional payload or command
 */
export interface GenericPayloadRef {
  payloadType: string // e.g. "TIER_UPGRADE", "DISPATCH_ORDER", "STRATEGY_SELECT"
  payloadId: string
  data?: Record<string, any>
}

/**
 * Authoritative Shared Decision model
 */
export interface SharedDecision {
  decisionId: string
  decisionType: string
  status: DecisionStatus

  createdGameDay: number
  resolvedGameDay?: number

  timeoutGameDays?: number
  timeoutAtGameDay?: number

  fallbackPolicy: DecisionFallbackPolicy

  contextRef: GenericEntityRef
  payloadRef?: GenericPayloadRef
  ownerRef?: GenericEntityRef
  eventId?: string // Optional relation to WORLD event

  decisionScopeKey: string // e.g. "SHIP:ship_123:STRATEGIC"
  decisionSource?: DecisionSource
  priority: DecisionPriority

  title: string
  summary: string

  tags: string[]
  auditFlags: string[]
  reasonCodes: string[]
  relatedRefs: string[]

  invalidationReason?: string
  metadata?: Record<string, any>
}

/**
 * Snapshot for decision history and audit trails
 */
export interface DecisionHistoryRecord {
  id: string
  decisionId: string
  decisionType: string
  status: DecisionStatus
  decisionSource?: DecisionSource
  gameDay: number
  contextRef: GenericEntityRef
  summary: string
  reasonCodes: string[]
  invalidationReason?: string
  timestamp: string
}

/**
 * UI/Hub projection contract for displaying pending decisions
 */
export interface HubDecisionNotification {
  decisionId: string
  decisionType: string
  title: string
  summary: string
  priority: DecisionPriority
  createdGameDay: number
  timeoutAtGameDay?: number
  contextRef: GenericEntityRef
  status: DecisionStatus
  tags: string[]
  isExpiringSoon?: boolean
}

/**
 * Result returned by domain validators
 */
export interface DecisionValidationResult {
  status: "VALID" | "INVALID" | "BLOCKED"
  reason?: string
  details?: Record<string, any>
}

export type DecisionValidator = (
  decision: SharedDecision,
  context?: any
) => DecisionValidationResult

/**
 * Serializable state of the Shared Decision Engine for WORLD save/load
 */
export interface DecisionEngineState {
  pendingDecisions: SharedDecision[]
  history: DecisionHistoryRecord[]
}
