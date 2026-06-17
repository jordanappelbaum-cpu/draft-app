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

function rowToDraft(row: Record<string, unknown>): Draft {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    categoryId: row.category_id as string,
    mode: row.mode as Draft['mode'],
    rounds: row.rounds as number,
    teams: row.teams as Draft['teams'],
    picks: row.picks as Draft['picks'],
    status: row.status as Draft['status'],
    createdAt: new Date(row.created_at as string).getTime(),
  }
}

function draftToRow(d: Draft) {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    category_id: d.categoryId,
    mode: d.mode,
    rounds: d.rounds,
    teams: d.teams,
    picks: d.picks,
    status: d.status,
    created_at: new Date(d.createdAt).toISOString(),
  }
}

export async function loadDrafts(): Promise<Draft[]> {
  if (supabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
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
