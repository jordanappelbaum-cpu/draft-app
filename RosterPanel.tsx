import type { Pick, Team } from '../lib/types'
import { getItem } from '../data/categories'
import { colorOf } from '../lib/util'

interface Props {
  team: Team
  picks: Pick[]
  categoryId: string
  isOnClock: boolean
}

export default function RosterPanel({ team, picks, categoryId, isOnClock }: Props) {
  const c = colorOf(team.color)
  return (
    <div className={`card overflow-hidden p-0 ring-1 ${isOnClock ? c.ring : 'ring-white/5'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${c.bg}`}>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900/40 text-lg">{team.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`truncate font-display font-bold ${c.text}`}>{team.name}</div>
          <div className="text-[11px] text-slate-400">{picks.length} picks</div>
        </div>
        {isOnClock && (
          <span className="chip bg-white/10 text-[10px] uppercase tracking-wider text-white">picking</span>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {picks.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">No picks yet</div>
        ) : (
          picks.map((p) => {
            const item = getItem(categoryId, p.itemId)
            return (
              <div key={p.itemId} className="flex items-center gap-3 px-4 py-2.5 animate-slide-up">
                <span className="w-6 text-center text-xs font-semibold text-slate-500">R{p.round}</span>
                <span className="text-lg">{item?.emoji ?? '⭐'}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item?.name ?? 'Unknown'}</span>
                  {item?.subtitle && (
                    <span className="block truncate text-[11px] text-slate-500">{item.subtitle}</span>
                  )}
                </span>
                <span className="ml-auto text-[11px] text-slate-600">#{p.overall}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
