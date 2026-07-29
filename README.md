# Pensacola Aviators Rugby

Club website for the Pensacola Aviators (men) and Aviatrix (women) — public site, join form, schedule & results, media gallery, and an admin dashboard.

Rebuilt from the Grok app-builder session for [pcolarugby.com](https://pcolarugby.com).

## Features

- **Public site** — hero, about, practice info, live schedule/results, gallery, sponsors, join form
- **Admin dashboard** (sign-in required)
  - Inbox for join/interest messages
  - Season schedule & match results
  - Media library (upload, publish to homepage/gallery)
  - Homepage template & copy settings
  - Multi-admin allowlist (email-based)
- **PostgreSQL** via `DATABASE_URL` (Neon, RDS, or local Postgres)
- **REST API** under `/api/*`

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Express API + `pg`
- Session cookies for admin auth (simple email allowlist + password for local; plug OAuth later)

## Quick start

```bash
# Requires Node 20+ and a Postgres database
cp .env.example .env
# set DATABASE_URL=postgresql://user:pass@localhost:5432/aviators

npm install
npm run db:migrate
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001

Default admin (first run seeds if empty):

- Email: `admin@pcolarugby.com`
- Password: `aviators` (change immediately)

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Vite frontend + API concurrently |
| `npm run build` | Production frontend build |
| `npm run start` | Run API + serve built frontend |
| `npm run db:migrate` | Apply SQL migrations |

## Environment

See `.env.example`.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Cookie signing secret |
| `PORT` | API port (default 3001) |
| `VITE_API_URL` | Frontend → API base (dev proxy uses `/api`) |

## Deploy

1. Provision Postgres and set `DATABASE_URL`
2. `npm run build && npm run db:migrate && npm start`
3. Or deploy frontend to Vercel/Netlify and API to a Node host with the same `DATABASE_URL`

## License

Private club project — all rights reserved.
