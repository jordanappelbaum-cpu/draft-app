# 🏆 Draft

Draft **anything** with your friends — 20 built-in categories including animals,
football players, mascots, NBA & soccer stars, rappers, restaurants, movies,
cocktails, cars, candy and more. Pick a category, add your crew, and snake-draft
your way to the perfect roster.

This is a standalone app — it has nothing to do with AfterCall. It lives in a
self-contained `draft-app/` folder so it can be lifted into its own repo any time.

## Quick start

```bash
cd draft-app
npm install
npm run dev
```

Open the printed `localhost` URL. With no Supabase keys set, the app runs fully
**offline** — every draft is saved in your browser. That's enough to play.

## Connect Supabase (optional, for shared/persisted drafts)

1. In your Supabase project, open the **SQL Editor** and run
   [`supabase/schema.sql`](./supabase/schema.sql). It creates a `drafts` table
   with permissive RLS so anyone with the app can play.
2. Copy `.env.example` → `.env.local` and fill in from **Project Settings → API**:

   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

3. Restart `npm run dev`. Drafts now save to Supabase instead of the browser.

The app auto-detects the keys: present → Supabase, absent → offline. All the
swappable persistence logic lives in [`src/lib/storage.ts`](./src/lib/storage.ts).

### Accounts (so your drafts follow you across devices)

When Supabase is connected, a **Sign in** button appears in the top bar.
Accounts use Supabase Auth (email + password):

- Signed-in drafts are tagged with your account, so you'll see **Your drafts**
  on any device you sign into.
- Friends still join any draft by **code/link** and make live picks — accounts
  don't lock anyone out of shared play.
- Playing without signing in still works; those drafts just live on the one device.

**One setting for instant signups:** in Supabase → **Authentication → Sign In /
Providers → Email**, turn **off "Confirm email"** so people can sign up and play
immediately (no inbox round-trip). Leave it on if you'd rather verify emails.

## Deploy free on GitHub Pages (recommended)

This app is a perfect fit for GitHub Pages — it's fully static, uses hash
routing (no server rewrites needed), and serves over HTTPS (required for the
share/copy features). To host it on a brand-new, totally separate account:

1. Create the new GitHub account, then a new **public** repo (e.g. `draft`).
2. Copy **everything inside this `draft-app/` folder** — including the hidden
   `.github/`, `.env`, and `.gitignore` — into the **root** of that new repo,
   and push to `main`. (The included workflow assumes the app is at the repo root.)
3. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. The `.github/workflows/deploy.yml` workflow builds and publishes automatically.
   Your app goes live at `https://YOUR_USERNAME.github.io/REPO/` (or
   `https://YOUR_USERNAME.github.io/` if you name the repo `YOUR_USERNAME.github.io`).

Asset paths are relative (`base: './'` in `vite.config.ts`), so it works at
either URL with no extra config. The committed `.env` carries the public
Supabase anon key, so the build connects to Supabase with no secrets to set.

## How it works

- **Home** — hero + category grid + your saved drafts.
- **Setup** — pick a category, name it, choose snake vs linear, set rounds, add
  up to 10 teams.
- **Draft board** — shows who's on the clock, a searchable pool of options,
  one-tap picks, 🎲 auto-pick, undo, and a live progress bar. Confetti when it
  fills up.
- **Rosters** — every team's picks, round by round.

## Tech

Vite · React · TypeScript · Tailwind · Supabase (optional) · canvas-confetti.

## Where to take it next

- Realtime multiplayer (split `teams`/`picks` into tables + Supabase Realtime).
- Per-pick timer that auto-picks when it expires.
- Custom categories you build in-app.
- Post-draft voting / "who won the draft" rankings.
- Shareable roster cards.
