import { supabase, supabaseEnabled } from './supabase'

export interface Account {
  id: string
  email: string
}

export { supabaseEnabled as authEnabled }

function toAccount(user: { id: string; email?: string } | null | undefined): Account | null {
  if (!user) return null
  return { id: user.id, email: user.email ?? '' }
}

export async function currentAccount(): Promise<Account | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return toAccount(data.user)
}

/** Fire `cb` whenever the signed-in user changes. Returns an unsubscribe fn. */
export function onAuthChange(cb: (account: Account | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(toAccount(session?.user))
  })
  return () => data.subscription.unsubscribe()
}

export async function signUp(email: string, password: string): Promise<Account> {
  if (!supabase) throw new Error('Accounts need Supabase connected')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  const account = toAccount(data.user)
  if (!account) throw new Error('Check your email to confirm your account, then sign in.')
  return account
}

export async function signIn(email: string, password: string): Promise<Account> {
  if (!supabase) throw new Error('Accounts need Supabase connected')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const account = toAccount(data.user)
  if (!account) throw new Error('Sign in failed')
  return account
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}
