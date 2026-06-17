import { useState } from 'react'
import type { Account } from '../lib/auth'
import { signIn, signUp, signOut } from '../lib/auth'

export default function AccountMenu({
  account,
  onChange,
}: {
  account: Account | null
  onChange: () => void
}) {
  const [open, setOpen] = useState(false)

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span
          title={account.email}
          className="hidden max-w-[10rem] truncate text-xs text-slate-400 sm:inline"
        >
          {account.email}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold uppercase">
          {account.email.charAt(0) || '?'}
        </span>
        <button
          onClick={async () => {
            await signOut()
            onChange()
          }}
          className="btn-ghost px-2.5 py-1.5 text-xs"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost px-3 py-1.5 text-xs">
        Sign in
      </button>
      {open && (
        <AuthModal
          onClose={() => setOpen(false)}
          onAuthed={() => {
            setOpen(false)
            onChange()
          }}
        />
      )}
    </>
  )
}

function AuthModal({ onClose, onAuthed }: { onClose: () => void; onAuthed: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'up') {
        await signUp(email.trim(), password)
      } else {
        await signIn(email.trim(), password)
      }
      onAuthed()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      // signUp throws a friendly "check your email" message when confirmation is on.
      if (/confirm/i.test(msg)) setNotice(msg)
      else setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card w-full max-w-sm animate-pop-in p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-2xl">🏆</div>
        <h2 className="font-display text-xl font-bold">
          {mode === 'up' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Sign in so your drafts follow you to any device.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            className="input"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {notice && <p className="text-sm text-emerald-300">{notice}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? '…' : mode === 'up' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'up' ? 'in' : 'up')
            setError(null)
            setNotice(null)
          }}
          className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-200"
        >
          {mode === 'up' ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </div>
    </div>
  )
}
