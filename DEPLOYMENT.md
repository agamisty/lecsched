# Deploying LecSched to Vercel

LecSched is a monorepo (npm workspaces) with a React frontend (`client/`) and an Express + Sequelize backend (`server/`). This guide deploys it to **Vercel** with a **PostgreSQL** database hosted on **Neon** (or **Supabase**).

> Why not SQLite? Vercel serverless functions have an ephemeral filesystem — data written to a local SQLite file is wiped between requests. A hosted Postgres database persists data and supports multiple function instances.

## Architecture

```
Browser ──▶ Vercel edge ──▶ /assets/* ──▶ client/dist (static SPA)
                          └─▶ /api/*, /socket.io/* ──▶ api/index.js (Express + Socket.io)
                                                                │
                                                                ▼
                                                        PostgreSQL (Neon/Supabase)
```

- The API and the SPA are served from the **same domain**, so the frontend's same-origin `/api` calls and Socket.io connections just work.
- `client/src/services/api.js` uses `VITE_API_URL` when set, otherwise `/api` (same-origin).
- `vercel.json` sends `/api/*` and `/socket.io/*` to the serverless function and everything else to the SPA.

## Prerequisites

- Node 20+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A **Neon** (https://neon.tech) or **Supabase** (https://supabase.com) account

## Step 1 — Create the PostgreSQL database

### Option A: Neon (recommended)
1. Sign in to Neon, click **Create a project** (pick a region close to you).
2. Open the project → **Connection details** → copy the **Pooled connection string**:
   `postgresql://USER:PASSWORD@ep-...pooler.region.aws.neon.tech/neondb?sslmode=require`
3. Save it. You will paste it as `DATABASE_URL` on Vercel.

### Option B: Supabase
1. Create a new project → copy the **Database connection string** from **Project Settings → Database**.
2. Prefer the **Session pooler** string (`...pooler.supabase.com`) with `sslmode=require`.

> Both work with the SSL settings already configured in `server/db.js`.

## Step 2 — Configure the environment on Vercel

Either in the Vercel dashboard (**Settings → Environment Variables**) or with the CLI:

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
```

- `DATABASE_URL` — the Neon/Supabase connection string from Step 1.
- `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`).
- Optional: `CLIENT_ORIGIN` — CORS origin for Socket.io (defaults to `*`).

## Step 3 — Deploy

```bash
# 1. Log in / link the project (creates .vercel/ with the project link)
vercel login
vercel link

# 2. First deployment (staging preview)
vercel

# 3. Production deployment
vercel --prod
```

Or push to GitHub and import the repo into Vercel — the `vercel.json` build settings are picked up automatically.

## Step 4 — Prepare the database (one-time)

The app starts empty — the admin creates all data (faculties, departments, programs, years, courses, classrooms, etc.) through the UI. Two things are set up automatically on first boot:

- **Default time slots** — five standard class blocks are created by `server/seed.js`'s `ensureDefaultTimeSlots()`.
- **Admin account** — run the seed once to create `admin@lec.com` / `pass123`:

```bash
# Local machine, using the production DATABASE_URL so the data lands in Neon/Supabase:
# (Windows PowerShell)
$env:DATABASE_URL = "postgresql://USER:PASSWORD@.../neondb?sslmode=require"
npm run seed
```

The admin login is `admin@lec.com` / `pass123`.

> There is no demo/seed data anymore. To wipe everything and start fresh (keeps the admin user and default time slots), run:
> ```powershell
> $env:DATABASE_URL = "postgresql://USER:PASSWORD@.../neondb?sslmode=require"
> node server/clear-demo.js
> ```

## Environment variables summary

| Variable        | Where           | Required | Purpose                                  |
|-----------------|-----------------|----------|------------------------------------------|
| `DATABASE_URL`  | Vercel + local  | Yes      | Postgres connection string (Neon/Supabase) |
| `JWT_SECRET`    | Vercel + local  | Yes      | JWT signing secret                       |
| `CLIENT_ORIGIN` | Vercel (opt.)   | No       | Socket.io CORS origin (default `*`)      |
| `VITE_API_URL`  | Client build    | No       | Full API URL when the API is hosted separately (default same-origin `/api`) |

## Local development (now uses Postgres too)

The backend requires `DATABASE_URL` locally as well (the old SQLite file is no longer used):

```powershell
# Windows PowerShell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@.../neondb?sslmode=require"
$env:JWT_SECRET = "dev-secret"
npm run server        # backend on http://localhost:5000
npm run client        # frontend on http://localhost:5173
```

## Troubleshooting

- **`DATABASE_URL is required`** — the server can't find the env var. Add it to Vercel and re-deploy; set it locally before `npm run server`.
- **SSL errors from Postgres** — Neon/Supabase require SSL; `server/db.js` enables it by default. To disable (rare, e.g. local Postgres), set `DATABASE_SSL=false`.
- **401 loops in the browser** — the SPA expects a valid JWT. Re-login with `admin@lec.com` / `pass123`.
- **Chat not connecting** — Socket.io WebSockets require the `/socket.io/*` route (already in `vercel.json`). If a corporate firewall blocks WebSockets, Vercel falls back to HTTP long-polling over the same route.
- **Frontend calling a different API** — if you ever host the backend separately, rebuild the client with `VITE_API_URL=https://your-api.example.com`.
