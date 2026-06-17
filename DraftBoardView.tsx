import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import type { Draft, Pick } from '../lib/types'
import { getCategory } from '../data/categories'
import {
  teamOnClock,
  currentRound,
  totalPicks,
  takenItemIds,
  rosterFor,
} from '../lib/draftLogic'
import { colorOf } from '../lib/util'
import { supabaseEnabled } from '../lib/supabase'
import RosterPanel from '../components/RosterPanel'

interface Props {
  draft: Draft
  onChange: (draft: Draft) => void
  onExit: () => void
}

type Tab = 'board' | 'rosters'

export default function DraftBoardView({ draft, onChange, onExit }: Props) {
  const category = getCategory(draft.categoryId)!
  const [tab, setTab] = useState<Tab>('board')
  const [query, setQuery] = useState('')

  const onClock = teamOnClock(draft)
  const round = currentRound(draft)
  const total = totalPicks(draft)
  const complete = draft.picks.length >= total
  const taken = useMemo(() => takenItemIds(draft), [draft])

  const available = category.items.filter(
    (it) =>
      !taken.has(it.id) &&
      (query.trim() === '' || it.name.toLowerCase().includes(query.trim().toLowerCase())),
  )

  // Fire confetti + flip to rosters the moment the draft fills up.
  useEffect(() => {
    if (complete && draft.status !== 'complete') {
      onChange({ ...draft, status: 'complete' })
      celebrate()
      setTab('rosters')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete])

  function pick(itemId: string) {
    if (!onClock || complete) return
    const newPick: Pick = {
      itemId,
      teamId: onClock.id,
      round,
      overall: draft.picks.length + 1,
      at: Date.now(),
    }
    onChange({ ...draft, picks: [...draft.picks, newPick] })
  }

  function autoPick() {
    const pool = category.items.filter((it) => !taken.has(it.id))
    if (pool.length === 0) return
    pick(pool[Math.floor(Math.random() * pool.length)].id)
  }

  function undo() {
    if (draft.picks.length === 0) return
    onChange({ ...draft, status: 'active', picks: draft.picks.slice(0, -1) })
  }

  function reset() {
    if (!confirm('Clear all picks and restart this draft?')) return
    onChange({ ...draft, status: 'active', picks: [] })
    setTab('board')
  }

  const clockColor = onClock ? colorOf(onClock.color) : colorOf('violet')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="text-sm text-slate-400 hover:text-slate-200">
          ← exit
        </button>
        <div className="flex-1" />
        <button onClick={undo} disabled={draft.picks.length === 0} className="btn-ghost px-3 py-1.5 text-xs">
          ↶ Undo
        </button>
        <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs">
          Reset
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 text-2xl">
          {category.emoji}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">{draft.name}</h1>
          <p className="text-sm text-slate-400">
            {category.name} · {draft.mode} draft · pick {Math.min(draft.picks.length + 1, total)} of {total}
          </p>
        </div>
      </div>

      <InviteBar code={draft.code} />

      {/* On the clock */}
      {complete ? (
        <div className="card animate-pop-in flex items-center gap-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/10 p-4 ring-emerald-500/30">
          <span className="text-3xl">🎉</span>
          <div>
            <div className="font-display text-lg font-bold">Draft complete!</div>
            <div className="text-sm text-slate-300">Every team filled their roster. Check it out below.</div>
          </div>
        </div>
      ) : (
        onClock && (
          <div className={`card flex items-center gap-3 p-4 ring-1 ${clockColor.ring} ${clockColor.bg}`}>
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-ink-900/40 text-2xl">
              <span className="absolute inset-0 animate-pulse-ring rounded-2xl" />
              {onClock.emoji}
            </span>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-slate-400">On the clock · Round {round}</div>
              <div className={`font-display text-lg font-bold ${clockColor.text}`}>{onClock.name}</div>
            </div>
            <button onClick={autoPick} className="btn-ghost px-3 py-2 text-xs">
              🎲 Auto-pick
            </button>
          </div>
        )
      )}

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${(draft.picks.length / total) * 100}%` }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1">
        <TabButton active={tab === 'board'} onClick={() => setTab('board')}>
          Draft board
        </TabButton>
        <TabButton active={tab === 'rosters'} onClick={() => setTab('rosters')}>
          Rosters
        </TabButton>
      </div>

      {tab === 'board' ? (
        <div className="space-y-4">
          {!complete && (
            <input
              className="input"
              placeholder={`Search ${category.name.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          {available.length === 0 ? (
            <div className="card grid place-items-center p-10 text-slate-400">
              {complete ? 'All picks are in. 🏁' : 'No matches — try another search.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {available.map((it) => (
                <button
                  key={it.id}
                  onClick={() => pick(it.id)}
                  disabled={complete}
                  className="group card flex items-center gap-3 p-3 text-left transition hover:-translate-y-0.5 hover:ring-violet-500/40 disabled:opacity-50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-700 text-xl">
                    {it.emoji ?? '⭐'}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold leading-tight">{it.name}</span>
                    {it.subtitle && (
                      <span className="block truncate text-xs text-slate-400">{it.subtitle}</span>
                    )}
                  </span>
                  <span className="ml-auto text-slate-600 transition group-hover:text-violet-300">+</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.teams.map((team) => (
            <RosterPanel
              key={team.id}
              team={team}
              picks={rosterFor(draft, team.id)}
              categoryId={draft.categoryId}
              isOnClock={!complete && onClock?.id === team.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-ink-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function InviteBar({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}${window.location.pathname}#/d/${code}`

  async function share() {
    const data = { title: 'Join my draft', text: `Join my draft — code ${code}`, url: link }
    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
    } catch {
      /* user dismissed the share sheet */
    }
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">
          {supabaseEnabled ? 'Invite friends — they join on their phones' : 'Draft code'}
        </div>
        <div className="font-display text-xl font-bold tracking-[0.35em] text-violet-300">{code}</div>
      </div>
      {supabaseEnabled ? (
        <button onClick={share} className="btn-ghost text-xs">
          {copied ? '✓ Link copied' : '📲 Share invite'}
        </button>
      ) : (
        <span className="chip bg-amber-500/10 text-[11px] text-amber-300">connect Supabase to share</span>
      )}
    </div>
  )
}

function celebrate() {
  const end = Date.now() + 700
  const colors = ['#8b5cf6', '#ec4899', '#22d3ee', '#f59e0b']
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
