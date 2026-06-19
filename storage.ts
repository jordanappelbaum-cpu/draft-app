import type { Draft } from './types'
import { supabase, supabaseEnabled } from './supabase'

// Offline-first persistence with an optional Supabase backend.
//
// The whole app speaks to this module, so swapping localStorage for Supabase
// (or a future realtime/multiplayer layer) only touches this one file.
//
// Supabase table (see supabase/schema.sql):
//   drafts(id uuid pk, name text, category_id text, mode text, rounds int,
//          teams jsonb, picks jsonb, status text, created_at timestamptz)

const KEY = 'draftapp.drafts.v1'
const SEEN_KEY = 'draftapp.seenIds.v1'
const DEVICE_KEY = 'draftapp.deviceId.v1'

/**
 * A stable, anonymous id for this browser/device. Used so each phone gets
 * exactly one "best team" vote, even when nobody is signed in.
 */
export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'dev-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function readLocal(): Draft[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Draft[]) : []
  } catch {
    return []
  }
}

function writeLocal(drafts: Draft[]) {
  localStorage.setItem(KEY, JSON.stringify(drafts))
}

// Ids of drafts this device has created or joined — so they show under "Your
// drafts" even when signed out, or when joined from someone else's account.
function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function rememberDraft(id: string) {
  const seen = readSeen()
  if (!seen.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([id, ...seen].slice(0, 200)))
}

function rowToDraft(row: Record<string, unknown>): Draft {
  return {
    id: row.id as string,
    code: row.code as string,
    ownerId: (row.owner_id as string) ?? null,
    name: row.name as string,
    categoryId: row.category_id as string,
    mode: row.mode as Draft['mode'],
    rounds: row.rounds as number,
    teams: row.teams as Draft['teams'],
    picks: row.picks as Draft['picks'],
    votes: (row.votes as Draft['votes']) ?? [],
    status: row.status as Draft['status'],
    createdAt: new Date(row.created_at as string).getTime(),
  }
}

function draftToRow(d: Draft) {
  return {
    id: d.id,
    code: d.code,
    owner_id: d.ownerId ?? null,
    name: d.name,
    category_id: d.categoryId,
    mode: d.mode,
    rounds: d.rounds,
    teams: d.teams,
    picks: d.picks,
    votes: d.votes ?? [],
    status: d.status,
    created_at: new Date(d.createdAt).toISOString(),
  }
}

/**
 * Load the drafts to show under "Your drafts": the ones you own (across all your
 * devices, when signed in) plus any you've created or joined on this device.
 */
export async function loadDrafts(ownerId?: string | null): Promise<Draft[]> {
  if (supabaseEnabled && supabase) {
    const seen = readSeen()
    const filters: string[] = []
    if (ownerId) filters.push(`owner_id.eq.${ownerId}`)
    if (seen.length) filters.push(`id.in.(${seen.join(',')})`)
    if (filters.length === 0) return []
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .or(filters.join(','))
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('Supabase load failed, falling back to local:', error.message)
      return readLocal()
    }
    return (data ?? []).map(rowToDraft)
  }
  return readLocal().sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveDraft(draft: Draft): Promise<void> {
  rememberDraft(draft.id)
  if (supabaseEnabled && supabase) {
    const { error } = await supabase.from('drafts').upsert(draftToRow(draft))
    if (error) console.warn('Supabase save failed:', error.message)
    return
  }
  const all = readLocal()
  const idx = all.findIndex((d) => d.id === draft.id)
  if (idx >= 0) all[idx] = draft
  else all.unshift(draft)
  writeLocal(all)
}

/** Find a draft by its short join code. Used when a friend joins via code/link. */
export async function findDraftByCode(code: string): Promise<Draft | null> {
  const wanted = code.trim().toUpperCase()
  if (supabaseEnabled && supabase) {
    const { data, error } = await supabase.from('drafts').select('*').eq('code', wanted).maybeSingle()
    if (error) {
      console.warn('Supabase code lookup failed:', error.message)
      return null
    }
    return data ? rowToDraft(data) : null
  }
  return readLocal().find((d) => d.code === wanted) ?? null
}

/**
 * Subscribe to live updates for a single draft (Supabase Realtime).
 * Returns an unsubscribe function. No-op when offline.
 */
export function subscribeDraft(id: string, onUpdate: (draft: Draft) => void): () => void {
  const client = supabase
  if (!supabaseEnabled || !client) return () => {}
  const channel = client
    .channel(`draft:${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'drafts', filter: `id=eq.${id}` },
      (payload) => onUpdate(rowToDraft(payload.new as Record<string, unknown>)),
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

export async function deleteDraft(id: string): Promise<void> {
  if (supabaseEnabled && supabase) {
    const { error } = await supabase.from('drafts').delete().eq('id', id)
    if (error) console.warn('Supabase delete failed:', error.message)
    return
  }
  writeLocal(readLocal().filter((d) => d.id !== id))
}
