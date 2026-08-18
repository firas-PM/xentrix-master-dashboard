# Xentrix — Master Dashboard

One dashboard for every Xentrix-run brand — track projects, assign tasks, and
run daily operations across every product and business under one roof.

## Stack

- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Auth**: NextAuth v5 (credentials + optional magic link via Resend)
- **DB**: MongoDB Atlas + Mongoose
- **UI**: Tailwind CSS v4, dark by default
- **Cron**: Vercel Cron (materializes recurring tasks every 15 minutes)

## Getting started

```bash
pnpm install
cp .env.example .env.local     # fill in the values, then:
pnpm db:ping                    # verify MongoDB connectivity
pnpm db:seed                    # seed brands, founder, sample data
pnpm dev
```

Log in with the seeded founder account:
- Email: `firas@xentrix.xyz`
- Password: `founder123` (change immediately from Account settings)

## Environment variables

| Var | Required | Notes |
|---|---|---|
| `MONGODB_URI` | ✅ | `mongodb+srv://…/xentrix_dashboard?…` |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ in prod | `https://<your-domain>` |
| `CRON_SECRET` | ✅ | Bearer token for `/api/cron/*` |
| `RESEND_API_KEY` | optional | Enables the magic-link login |
| `EMAIL_FROM` | optional | Verified sender on Resend |

## Data model (high-level)

- **Brand** — a business unit (Xentrix, Numan, PM, Bake+Brew, …)
- **Membership** — a user's role inside a brand (`worker | manager | brand_admin | founder`)
- **Project** — a Xentrix-built product moving through stages
- **Task** — dev, design, ops, sales, admin, or chore — cross-brand
- **RecurringTaskTemplate** — daily/weekly/monthly chore that materializes
  into fresh Tasks at the brand's local time

## Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm db:ping      # smoke-test the Mongo connection
pnpm db:seed      # seed default brands + founder (idempotent)
pnpm db:seed --wipe   # nuke and re-seed
```

## Deploy

Deploys on Vercel. The `vercel.json` file registers the recurring-task cron.
Set all env vars in the Vercel dashboard.
