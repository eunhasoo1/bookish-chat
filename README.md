# BookishChat (Web)

Vintage library-card reading journal with Edmund, your AI librarian.

Port of the iOS BookishChat app to **Next.js** + **Supabase**, ready for **Vercel**.

## Features

- Google sign-in + membership-card onboarding
- Year-based library cards (16 rows, multi-page swipe)
- Wooden shelf of past years
- Add / edit / delete book entries
- Per-book chat with Edmund (DeepSeek, streamed)

## Setup

### 1. Install

```bash
cd bookish-chat
npm install
cp .env.local.example .env.local
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Google** — enable Google and paste your Google Cloud OAuth Client ID + Secret
3. In Google Cloud Console, create an OAuth 2.0 Web client. Authorized redirect URI:
   `https://<project-ref>.supabase.co/auth/v1/callback`
4. In Supabase **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (and your Vercel URL in production)
   - Redirect URLs: `http://localhost:3000/auth/callback` (and `https://your-app.vercel.app/auth/callback`)
5. **SQL Editor** — run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
6. Copy Project URL + anon key into `.env.local`

Anonymous sign-ins are **not** required.

### 3. DeepSeek

Add your API key to `.env.local` as `DEEPSEEK_API_KEY`.  
The browser never sees this key; chat goes through `/api/chat`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import in Vercel
3. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DEEPSEEK_API_KEY`
4. Add your Vercel URL to Supabase redirect URLs (and Google OAuth if needed)
5. Deploy

## Project layout

```
src/
  app/                 # Next.js App Router + /api/chat + /auth/callback
  components/
    auth/              # Google sign-in
    onboarding/        # Membership card
    library/           # Cards, shelf, edit sheet
    chat/              # Edmund chat UI
  hooks/               # Auth + data helpers
  lib/                 # Tokens, prompts, Supabase clients
supabase/migrations/   # Schema + RLS
```

## Notes

- Auth uses **Google OAuth**. Profile display name is seeded from Google when available; otherwise the membership card collects a name.
- Current-year card uses `new Date().getFullYear()` (not hardcoded).
- The original iOS app under `Developer/BookishChat` is unchanged.
