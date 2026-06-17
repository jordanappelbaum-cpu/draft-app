import { useEffect, useState, useCallback, useRef } from 'react'
import type { Draft } from './lib/types'
import {
  loadDrafts,
  saveDraft,
  deleteDraft,
  findDraftByCode,
  subscribeDraft,
  rememberDraft,
} from './lib/storage'
import { supabaseEnabled } from './lib/supabase'
import { type Account, authEnabled, currentAccount, onAuthChange } from './lib/auth'
import AccountMenu from './components/AccountMenu'
import HomeView from './views/HomeView'
import NewDraftView from './views/NewDraftView'
import DraftBoardView from './views/DraftBoardView'

type Route =
  | { name: 'home' }
  | { name: 'new'; categoryId?: string }
  | { name: 'draft'; draftId: string }

function hashCode(): string | null {
  const m = window.location.hash.match(/^#\/d\/([A-Za-z0-9]+)/)
  return m ? m[1].toUpperCase() : null
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [account, setAccount] = useState<Account | null>(null)

  // Keep a ref so realtime callbacks always see the latest list.
  const draftsRef = useRef<Draft[]>([])
  draftsRef.current = drafts
  const accountRef = useRef<Account | null>(null)
  accountRef.current = account

  const refreshDrafts = useCallback(async () => {
    setDrafts(await loadDrafts(accountRef.current?.id))
  }, [])

  // Initial load + deep-link join (#/d/CODE opens straight into a draft).
  useEffect(() => {
    ;(async () => {
      const acct = authEnabled ? await currentAccount() : null
      accountRef.current = acct
      setAccount(acct)
      const list = await loadDrafts(acct?.id)
      setDrafts(list)
      const code = hashCode()
      if (code) {
        const found = list.find((d) => d.code === code) ?? (await findDraftByCode(code))
        if (found) {
          rememberDraft(found.id)
          setDrafts((prev) => (prev.some((d) => d.id === found.id) ? prev : [found, ...prev]))
          setRoute({ name: 'draft', draftId: found.id })
        }
      }
      setLoading(false)
    })()
  }, [])

  // React to sign in / sign out: reload the user's drafts.
  useEffect(() => {
    return onAuthChange((acct) => {
      accountRef.current = acct
      setAccount(acct)
      void refreshDrafts()
    })
  }, [refreshDrafts])

  // Reflect the active draft in the URL so it's shareable / refresh-safe.
  useEffect(() => {
    if (route.name === 'draft') {
      const d = draftsRef.current.find((x) => x.id === route.draftId)
      if (d) window.history.replaceState(null, '', `#/d/${d.code}`)
    } else if (route.name === 'home') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [route])

  // Live sync: while viewing a draft, apply remote updates from other phones.
  useEffect(() => {
    if (route.name !== 'draft') return
    return subscribeDraft(route.draftId, (incoming) => {
      setDrafts((prev) => prev.map((d) => (d.id === incoming.id ? incoming : d)))
    })
  }, [route])

  const upsert = useCallback(async (draft: Draft) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.id === draft.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = draft
        return next
      }
      return [draft, ...prev]
    })
    await saveDraft(draft)
  }, [])

  const remove = useCallback(async (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    await deleteDraft(id)
  }, [])

  const join = useCallback(
    async (rawCode: string) => {
      setJoinError(null)
      const code = rawCode.trim().toUpperCase()
      if (!code) return
      const existing = drafts.find((d) => d.code === code)
      const found = existing ?? (await findDraftByCode(code))
      if (!found) {
        setJoinError(supabaseEnabled ? `No draft found with code ${code}` : 'Joining needs Supabase connected')
        return
      }
      rememberDraft(found.id)
      setDrafts((prev) => (prev.some((d) => d.id === found.id) ? prev : [found, ...prev]))
      setRoute({ name: 'draft', draftId: found.id })
    },
    [drafts],
  )

  const activeDraft =
    route.name === 'draft' ? drafts.find((d) => d.id === route.draftId) : undefined

  return (
    <div className="min-h-full">
      <TopBar
        onHome={() => setRoute({ name: 'home' })}
        account={account}
        onAccountChange={refreshDrafts}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">
        {loading ? (
          <div className="grid place-items-center py-32 text-slate-500">Loading…</div>
        ) : route.name === 'home' ? (
          <HomeView
            drafts={drafts}
            joinError={joinError}
            onJoin={join}
            onStartCategory={(categoryId) => setRoute({ name: 'new', categoryId })}
            onNew={() => setRoute({ name: 'new' })}
            onOpen={(id) => setRoute({ name: 'draft', draftId: id })}
            onDelete={remove}
          />
        ) : route.name === 'new' ? (
          <NewDraftView
            initialCategoryId={route.categoryId}
            ownerId={account?.id ?? null}
            onCancel={() => setRoute({ name: 'home' })}
            onCreate={async (draft) => {
              await upsert(draft)
              setRoute({ name: 'draft', draftId: draft.id })
            }}
          />
        ) : activeDraft ? (
          <DraftBoardView
            draft={activeDraft}
            onChange={upsert}
            onExit={() => setRoute({ name: 'home' })}
          />
        ) : (
          <div className="grid place-items-center py-32 text-slate-500">Draft not found.</div>
        )}
      </main>

      {!supabaseEnabled && route.name === 'home' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 flex justify-center">
          <span className="chip bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
            offline mode · saved in this browser
          </span>
        </div>
      )}
    </div>
  )
}

function TopBar({
  onHome,
  account,
  onAccountChange,
}: {
  onHome: () => void
  account: Account | null
  onAccountChange: () => void
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <button onClick={onHome} className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg shadow-lg shadow-violet-900/40">
            🏆
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Draft<span className="text-violet-400">.</span>
          </span>
        </button>
        <span className="ml-1 hidden text-xs text-slate-500 sm:inline">
          draft anything with your friends
        </span>
        <div className="flex-1" />
        {authEnabled && <AccountMenu account={account} onChange={onAccountChange} />}
      </div>
    </header>
  )
}
