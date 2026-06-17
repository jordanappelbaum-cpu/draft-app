import { useMemo, useState } from 'react'
import type { Draft, DraftMode, Team } from '../lib/types'
import { CATEGORIES, getCategory } from '../data/categories'
import { uid, shortCode, TEAM_PRESETS, colorOf } from '../lib/util'

interface Props {
  initialCategoryId?: string
  onCancel: () => void
  onCreate: (draft: Draft) => void
}

function makeTeam(i: number, name?: string): Team {
  const preset = TEAM_PRESETS[i % TEAM_PRESETS.length]
  return { id: uid(), name: name ?? `Team ${i + 1}`, emoji: preset.emoji, color: preset.color }
}

export default function NewDraftView({ initialCategoryId, onCancel, onCreate }: Props) {
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? CATEGORIES[0].id)
  const category = getCategory(categoryId)!
  const [name, setName] = useState(`${category.name} Draft`)
  const [mode, setMode] = useState<DraftMode>('snake')
  const [rounds, setRounds] = useState(3)
  const [teams, setTeams] = useState<Team[]>([makeTeam(0), makeTeam(1)])

  const maxRounds = useMemo(
    () => Math.max(1, Math.floor(category.items.length / Math.max(1, teams.length))),
    [category.items.length, teams.length],
  )
  const cappedRounds = Math.min(rounds, maxRounds)

  function addTeam() {
    if (teams.length >= 10) return
    setTeams((t) => [...t, makeTeam(t.length)])
  }
  function removeTeam(id: string) {
    if (teams.length <= 2) return
    setTeams((t) => t.filter((x) => x.id !== id))
  }
  function renameTeam(id: string, value: string) {
    setTeams((t) => t.map((x) => (x.id === id ? { ...x, name: value } : x)))
  }

  function start() {
    const draft: Draft = {
      id: uid(),
      code: shortCode(),
      name: name.trim() || `${category.name} Draft`,
      categoryId,
      mode,
      rounds: cappedRounds,
      teams,
      picks: [],
      status: 'active',
      createdAt: Date.now(),
    }
    onCreate(draft)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200">
        ← back
      </button>

      <h1 className="font-display text-2xl font-bold">Set up your draft</h1>

      {/* Category */}
      <div className="space-y-3">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryId(c.id)
                setName((prev) => (/Draft$/.test(prev) ? `${c.name} Draft` : prev))
              }}
              className={`chip text-sm transition ${
                c.id === categoryId
                  ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Draft name</Label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* Mode + rounds */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Draft type</Label>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton active={mode === 'snake'} onClick={() => setMode('snake')} label="Snake" hint="↩ reverses" />
            <ModeButton active={mode === 'linear'} onClick={() => setMode('linear')} label="Linear" hint="same order" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Rounds</Label>
          <div className="flex items-center gap-2">
            <Stepper value={cappedRounds} min={1} max={maxRounds} onChange={setRounds} />
            <span className="text-xs text-slate-500">max {maxRounds}</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Teams ({teams.length})</Label>
          <button onClick={addTeam} disabled={teams.length >= 10} className="btn-ghost px-3 py-1.5 text-xs">
            + Add team
          </button>
        </div>
        <div className="space-y-2">
          {teams.map((t, i) => {
            const c = colorOf(t.color)
            return (
              <div key={t.id} className={`card flex items-center gap-3 p-2.5 ring-1 ${c.ring}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-lg text-lg ${c.bg}`}>{t.emoji}</span>
                <input
                  className="input flex-1 bg-transparent ring-0 focus:ring-1"
                  value={t.name}
                  onChange={(e) => renameTeam(t.id, e.target.value)}
                  placeholder={`Team ${i + 1}`}
                />
                <button
                  onClick={() => removeTeam(t.id)}
                  disabled={teams.length <= 2}
                  className="rounded-lg px-2 py-1 text-slate-500 transition hover:text-rose-300 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-ink-800/60 p-3 text-sm text-slate-400 ring-1 ring-white/5">
        <span>
          {teams.length} teams × {cappedRounds} rounds ={' '}
          <span className="font-semibold text-slate-200">{teams.length * cappedRounds} picks</span>
        </span>
        <button onClick={start} className="btn-primary">
          Start drafting →
        </button>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</div>
}

function ModeButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active ? 'bg-violet-500/20 ring-1 ring-violet-500/40' : 'bg-white/5 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-[11px] text-slate-400">{hint}</div>
    </button>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
      <button
        className="h-8 w-8 rounded-lg text-lg hover:bg-white/10 disabled:opacity-30"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        −
      </button>
      <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
      <button
        className="h-8 w-8 rounded-lg text-lg hover:bg-white/10 disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}
