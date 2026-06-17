// ---- Catalog (the stuff you can draft) ----

export interface DraftItem {
  id: string
  name: string
  subtitle?: string
  emoji?: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  tagline: string
  /** tailwind gradient stops, e.g. "from-orange-500 to-rose-500" */
  gradient: string
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

export type DraftStatus = 'setup' | 'active' | 'complete'
export type DraftMode = 'snake' | 'linear'

export interface Draft {
  id: string
  /** short, friendly code friends type to join (e.g. "K7QX") */
  code: string
  name: string
  categoryId: string
  mode: DraftMode
  rounds: number
  teams: Team[]
  picks: Pick[]
  status: DraftStatus
  createdAt: number
}
