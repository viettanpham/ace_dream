/**
 * STARFRONT WORLD — Shared History Retention & Compaction Engine (Phase 6.34A-FND-5)
 *
 * Implements:
 * 1. Bounded memory retention for long-running world sessions.
 * 2. Compaction policy: Preserves HEAD (initial events), preserves TAIL (recent events),
 *    and protects PINNED event types unconditionally.
 * 3. Invariant: NEVER trims current world state, pending decisions, active reservations,
 *    in-transit records, or settlement audit receipts.
 */

import type {
  CompactedHistorySummary,
  HistoryRetentionConfig,
} from "./types"

export const DEFAULT_HISTORY_RETENTION_CONFIG: HistoryRetentionConfig = {
  maxDetailedEvents: 50,
  preserveHeadEvents: 10,
  preserveTailEvents: 20,
  maxHistoryBytes: 500_000,
  pinnedEventTypes: [
    "WORLD_INITIALIZED",
    "SECTOR_CONQUERED",
    "CAPITAL_FOUNDED",
    "DISASTER_MAJOR",
    "SAR_CRITICAL_RESCUE",
  ],
  compactionPolicy: "SUMMARIZE_AND_PRUNE",
}

export interface GenericHistoricalEvent {
  id: string
  eventType: string
  gameDay: number
  description: string
  isPinned?: boolean
  details?: Record<string, any>
}

/**
 * Compacts a list of historical events according to retention policy
 */
export function compactHistoryEvents<T extends GenericHistoricalEvent>(
  events: T[],
  config: HistoryRetentionConfig = DEFAULT_HISTORY_RETENTION_CONFIG
): {
  retainedEvents: T[]
  summaries: CompactedHistorySummary[]
  prunedCount: number
} {
  if (events.length <= config.maxDetailedEvents) {
    return {
      retainedEvents: [...events],
      summaries: [],
      prunedCount: 0,
    }
  }

  const pinnedSet = new Set(config.pinnedEventTypes)

  // 1. Separate pinned events (always retained)
  const isPinned = (e: any) =>
    Boolean(e.isPinned) || pinnedSet.has(e.eventType) || pinnedSet.has(e.type)

  // 2. Identify Head and Tail slices
  const headCount = Math.min(config.preserveHeadEvents, events.length)
  const tailCount = Math.min(config.preserveTailEvents, events.length)

  const headSlice = events.slice(0, headCount)
  const tailSlice = events.slice(events.length - tailCount)

  // 3. Middle slice to be compacted
  const middleSlice = events.slice(headCount, events.length - tailCount)

  const retainedFromMiddle: T[] = []
  const eventsToCompact: T[] = []

  for (const ev of middleSlice) {
    if (isPinned(ev)) {
      retainedFromMiddle.push(ev)
    } else {
      eventsToCompact.push(ev)
    }
  }

  // 4. Generate summary of compacted events
  const summaries: CompactedHistorySummary[] = []
  if (eventsToCompact.length > 0) {
    const startDay = eventsToCompact[0].gameDay
    const endDay = eventsToCompact[eventsToCompact.length - 1].gameDay

    const totalResourceDelta: Record<string, number> = {}
    const notableMilestones: string[] = []

    for (const ev of eventsToCompact) {
      if (ev.details?.resourceDelta) {
        for (const [k, v] of Object.entries(ev.details.resourceDelta)) {
          totalResourceDelta[k] = (totalResourceDelta[k] || 0) + Number(v)
        }
      }
      if (notableMilestones.length < 5) {
        const desc = ev.description || (ev as any).name || (ev as any).title || (ev as any).type || "Event"
        notableMilestones.push(`Day ${ev.gameDay}: ${desc.substring(0, 60)}`)
      }
    }

    summaries.push({
      periodStartGameDay: startDay,
      periodEndGameDay: endDay,
      totalEventsCompacted: eventsToCompact.length,
      totalResourceDelta,
      notableMilestones,
    })
  }

  // Combine retained events: Head + Retained Pinned Middle + Tail
  const retainedEvents = [...headSlice, ...retainedFromMiddle, ...tailSlice]

  return {
    retainedEvents,
    summaries,
    prunedCount: eventsToCompact.length,
  }
}
