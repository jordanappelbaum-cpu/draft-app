import type { Draft, Team } from './types'

/** Build the full team-order sequence for a draft (snake or linear). */
export function buildOrder(teamIds: string[], rounds: number, mode: Draft['mode']): string[] {
  const order: string[] = []
  for (let r = 0; r < rounds; r++) {
    const roundTeams = mode === 'snake' && r % 2 === 1 ? [...teamIds].reverse() : teamIds
    order.push(...roundTeams)
  }
  return order
}

/** Total picks expected across the whole draft. */
export function totalPicks(draft: Draft): number {
  return draft.teams.length * draft.rounds
}

/** Which team is on the clock right now (or null if the draft is done). */
export function teamOnClock(draft: Draft): Team | null {
  const order = buildOrder(draft.teams.map((t) => t.id), draft.rounds, draft.mode)
  const next = draft.picks.length
  if (next >= order.length) return null
  return draft.teams.find((t) => t.id === order[next]) ?? null
}

/** 1-based round number for the next pick. */
export function currentRound(draft: Draft): number {
  if (draft.teams.length === 0) return 1
  return Math.floor(draft.picks.length / draft.teams.length) + 1
}

/** Picks belonging to a single team, in pick order. */
export function rosterFor(draft: Draft, teamId: string) {
  return draft.picks.filter((p) => p.teamId === teamId)
}

/** Item ids already taken. */
export function takenItemIds(draft: Draft): Set<string> {
  return new Set(draft.picks.map((p) => p.itemId))
}
