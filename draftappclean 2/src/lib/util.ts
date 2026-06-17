export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Easy-to-read join code: no 0/O/1/I/L to avoid confusion at the dinner table.
export function shortCode(len = 4): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

// Distinct, good-looking team identities offered in setup.
export const TEAM_PRESETS = [
  { emoji: '🦊', color: 'orange' },
  { emoji: '🐙', color: 'violet' },
  { emoji: '🐲', color: 'emerald' },
  { emoji: '🦈', color: 'sky' },
  { emoji: '🦁', color: 'amber' },
  { emoji: '🐼', color: 'rose' },
  { emoji: '🦄', color: 'fuchsia' },
  { emoji: '🐢', color: 'teal' },
  { emoji: '🦅', color: 'indigo' },
  { emoji: '🐝', color: 'yellow' },
]

// Map a color token to concrete tailwind classes (kept explicit so Tailwind
// can see every class at build time and not purge them).
export const COLOR_CLASSES: Record<string, { text: string; bg: string; ring: string; dot: string }> = {
  orange: { text: 'text-orange-300', bg: 'bg-orange-500/15', ring: 'ring-orange-500/40', dot: 'bg-orange-400' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-500/15', ring: 'ring-violet-500/40', dot: 'bg-violet-400' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40', dot: 'bg-emerald-400' },
  sky: { text: 'text-sky-300', bg: 'bg-sky-500/15', ring: 'ring-sky-500/40', dot: 'bg-sky-400' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/15', ring: 'ring-amber-500/40', dot: 'bg-amber-400' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', ring: 'ring-rose-500/40', dot: 'bg-rose-400' },
  fuchsia: { text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/15', ring: 'ring-fuchsia-500/40', dot: 'bg-fuchsia-400' },
  teal: { text: 'text-teal-300', bg: 'bg-teal-500/15', ring: 'ring-teal-500/40', dot: 'bg-teal-400' },
  indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/15', ring: 'ring-indigo-500/40', dot: 'bg-indigo-400' },
  yellow: { text: 'text-yellow-300', bg: 'bg-yellow-500/15', ring: 'ring-yellow-500/40', dot: 'bg-yellow-400' },
}

export function colorOf(token: string) {
  return COLOR_CLASSES[token] ?? COLOR_CLASSES.violet
}
