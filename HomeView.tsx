import { useState } from 'react'
import type { Draft } from '../lib/types'
import { CATEGORIES, getCategory } from '../data/categories'
import { totalPicks } from '../lib/draftLogic'

interface Props {
  drafts: Draft[]
  joinError: string | null
  onJoin: (code: string) => void
  onStartCategory: (categoryId: string) => void
  onNew: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export default function HomeView({
  drafts,
  joinError,
  onJoin,
  onStartCategory,
  onNew,
  onOpen,
  onDelete,
}: Props) {
  const [code, setCode] = useState('')
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-ink-800/60 p-6 ring-1 ring-white/5 sm:p-10">
        <div className="absolute inset-x-0 -top-24 h-40 bg-violet-600/10 blur-3xl" />
        <p className="relative font-display text-xs font-semibold uppercase tracking-widest text-violet-300/90">
          Pick · draft · crown a winner
        </p>
        <h1 className="relative mt-2 max-w-xl font-display text-3xl font-bold leading-tight sm:text-5xl">
          Draft <span className="text-violet-400">anything</span> with your friends.
        </h1>
        <p className="relative mt-3 max-w-lg text-slate-400">
          Pick a category, add your crew, and snake-draft your way to the perfect roster — then vote
          on who picked best.
        </p>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button onClick={onNew} className="btn-primary text-base">
            Start a draft
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onJoin(code)
            }}
            className="flex items-center gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={6}
              className="input w-32 text-center font-display font-semibold tracking-[0.3em] uppercase"
            />
            <button type="submit" className="btn-ghost">
              Join
            </button>
          </form>
        </div>
        {joinError && <p className="mt-2 text-sm text-rose-300">{joinError}</p>}
      </section>

      {/* Categories */}
      <section>
        <SectionHeading title="Pick a category" subtitle="Tap one to start drafting" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onStartCategory(c.id)}
              className="group card relative overflow-hidden p-4 text-left transition hover:-translate-y-0.5 hover:ring-white/15"
            >
              <div
                className={`absolute inset-x-0 -top-16 h-24 bg-gradient-to-br ${c.gradient} opacity-0 blur-2xl transition group-hover:opacity-20`}
              />
              <div className="relative">
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-3 font-display font-semibold">{c.name}</div>
                <div className="text-xs text-slate-400">{c.tagline}</div>
                <div className="mt-3 text-[11px] text-slate-500">
                  {c.items.length} options{c.groups?.length ? ` · ${c.groups.length} filters` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Saved drafts */}
      {drafts.length > 0 && (
        <section>
          <SectionHeading title="Your drafts" subtitle="Resume or revisit" />
          <div className="space-y-2.5">
            {drafts.map((d) => {
              const cat = getCategory(d.categoryId)
              const done = d.picks.length >= totalPicks(d)
              return (
                <div
                  key={d.id}
                  className="card flex items-center gap-3 p-3.5 transition hover:ring-white/15"
                >
                  <button onClick={() => onOpen(d.id)} className="flex flex-1 items-center gap-3 text-left">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-700 text-xl">
                      {cat?.emoji ?? '🎲'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{d.name}</span>
                      <span className="block text-xs text-slate-400">
                        {cat?.name} · {d.teams.length} teams · {d.rounds} rounds
                      </span>
                    </span>
                  </button>
                  <span
                    className={`chip ${
                      done
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : d.status === 'active'
                          ? 'bg-violet-500/10 text-violet-300'
                          : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {done ? '✓ done' : d.status === 'active' ? 'live' : 'setup'}
                  </span>
                  <button
                    onClick={() => onDelete(d.id)}
                    className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/5 hover:text-rose-300"
                    title="Delete draft"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}
