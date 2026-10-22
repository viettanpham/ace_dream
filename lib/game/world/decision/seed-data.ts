/**
 * STARFRONT WORLD — Canonical SYSTEM Default Seed Data (Phase 6.34A-FND-3)
 *
 * Provides ready-to-use canonical master data files for:
 * 1. Fallback Policy: system_decision_fallback_policy_data.json
 * 2. Decision Source: system_decision_decision_source_data.json
 * 3. Decision Type: system_decision_decision_type_data.json
 * 4. Decision Priority: system_decision_decision_priority_data.json
 */

import type { CatalogNodeFile } from "../catalog/types"

export const SYSTEM_DEFAULT_FALLBACK_POLICIES = [
  {
    id: "AI_REEVALUATE",
    name: "AI Re-evaluation",
    description: "When timeout expires, domain AI re-evaluates context state and decides to approve, reject, or invalidate.",
    isDefault: true,
  },
  {
    id: "KEEP_PENDING",
    name: "Keep Pending",
    description: "Extends decision lifetime without auto-resolving.",
    isDefault: false,
  },
  {
    id: "AUTO_REJECT",
    name: "Auto Reject",
    description: "Automatically rejects decision on timeout without approval.",
    isDefault: false,
  },
]

export const SYSTEM_DEFAULT_DECISION_SOURCES = [
  {
    id: "COMMANDER_APPROVED",
    name: "Commander Approved",
    description: "Manual strategic approval by the Commander.",
  },
  {
    id: "COMMANDER_REJECTED",
    name: "Commander Rejected",
    description: "Manual strategic rejection by the Commander.",
  },
  {
    id: "AI_TIMEOUT_APPROVED",
    name: "AI Timeout Approved",
    description: "Automatic approval triggered by AI re-evaluation upon timeout.",
  },
  {
    id: "AI_TIMEOUT_REJECTED",
    name: "AI Timeout Rejected",
    description: "Automatic rejection triggered by AI re-evaluation upon timeout.",
  },
  {
    id: "INVALIDATED",
    name: "Invalidated",
    description: "Decision invalidated due to context expiration, missing entity, or supersession.",
  },
]

export const SYSTEM_DEFAULT_DECISION_TYPES = [
  {
    id: "TIER_UPGRADE_RECOMMENDATION",
    name: "Tier Upgrade Recommendation",
    description: "Progression entity reached tier boundary and requests breakthrough authorization.",
    defaultFallback: "AI_REEVALUATE",
    defaultPriority: "HIGH",
    defaultTimeoutDays: 3,
  },
  {
    id: "STRATEGIC_DEPLOYMENT",
    name: "Strategic Deployment",
    description: "Authorization to deploy fleet or reserves to high-threat zone.",
    defaultFallback: "AUTO_REJECT",
    defaultPriority: "CRITICAL",
    defaultTimeoutDays: 2,
  },
  {
    id: "RESOURCE_REALLOCATION",
    name: "Resource Reallocation",
    description: "Emergency requisition or transfer of materials between sectors.",
    defaultFallback: "AI_REEVALUATE",
    defaultPriority: "NORMAL",
    defaultTimeoutDays: 5,
  },
  {
    id: "EMERGENCY_DISPATCH",
    name: "Emergency Dispatch",
    description: "Emergency response mission dispatch authorization.",
    defaultFallback: "AUTO_REJECT",
    defaultPriority: "HIGH",
    defaultTimeoutDays: 1,
  },
]

export const SYSTEM_DEFAULT_DECISION_PRIORITIES = [
  { id: "LOW", order: 1, colorHex: "#64748B" },
  { id: "NORMAL", order: 2, colorHex: "#38BDF8" },
  { id: "HIGH", order: 3, colorHex: "#F59E0B" },
  { id: "CRITICAL", order: 4, colorHex: "#EF4444" },
]

export const SYSTEM_DECISION_CATALOG_FILES: Record<string, CatalogNodeFile> = {
  "system_decision_fallback_policy_data.json": {
    configFileId: "system_decision_fallback_policy",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_FALLBACK_POLICIES,
    metadata: {
      domain: "decision",
      catalog: "fallback_policy",
      description: "Canonical fallback policies for decision timeouts.",
    },
  },
  "system_decision_decision_source_data.json": {
    configFileId: "system_decision_decision_source",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_DECISION_SOURCES,
    metadata: {
      domain: "decision",
      catalog: "decision_source",
      description: "Canonical decision sources and resolution triggers.",
    },
  },
  "system_decision_decision_type_data.json": {
    configFileId: "system_decision_decision_type",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_DECISION_TYPES,
    metadata: {
      domain: "decision",
      catalog: "decision_type",
      description: "Canonical technical decision types.",
    },
  },
  "system_decision_decision_priority_data.json": {
    configFileId: "system_decision_decision_priority",
    schemaVersion: 1,
    dataVersion: 1,
    mode: "INLINE",
    items: SYSTEM_DEFAULT_DECISION_PRIORITIES,
    metadata: {
      domain: "decision",
      catalog: "decision_priority",
      description: "Canonical decision priority levels.",
    },
  },
}
