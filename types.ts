// ---- Catalog (the stuff you can draft) ----

export interface DraftItem {
  id: string
  name: string
  subtitle?: string
  emoji?: string
  /** id of the ItemGroup this item belongs to (powers in-category filtering) */
  group?: string
}

/** A sub-type within a category you can filter the pool by (e.g. "Fast food"). */
export interface ItemGroup {
  id: string
  name: string
  emoji?: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  tagline: string
  /** tailwind gradient stops, e.g. "from-orange-500 to-rose-500" */
  gradient: string
  /** optional sub-types, shown as filter chips on the draft board */
  groups?: ItemGroup[]
  items: DraftItem[]
}

// ---- A live draft ----

export interface Team {
  id: string
  name: string
  emoji: string
  /** tailwind text/bg color token, e.g. "violet" */
  color: string
}

export interface Pick {
  itemId: string
  teamId: string
  round: number
  /** 1-based overall pick number */
  overall: number
  at: number
}

/** One "best team" vote, cast once per device after the draft fills up. */
export interface Vote {
  voterId: string
  teamId: string
}

export type DraftStatus = 'setup' | 'active' | 'complete'
export type DraftMode = 'snake' | 'linear'

export interface Draft {
  id: string
  /** short, friendly code friends type to join (e.g. "K7QX") */
  code: string
  /** signed-in creator's account id (null for guest-created drafts) */
  ownerId: string | null
  name: string
  categoryId: string
  mode: DraftMode
  rounds: number
  teams: Team[]
  picks: Pick[]
  /** "who has the best roster" votes, gathered after the draft completes */
  votes?: Vote[]
  status: DraftStatus
  createdAt: number
}
