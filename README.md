# SoCal Tech Diaspora — Community Platform (MVP)

A web platform for **SoCal Tech Diaspora**, a community of Ukrainian tech
professionals, founders, and newcomers in Southern California.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** via Prisma ORM (use Supabase or Neon free tier)
- **Auth.js v5** (NextAuth) — email/password credentials
- **Resend** for transactional email
- Deploy on **Vercel**

## Features

- Public home + mission/values pages
- Membership application with **admin approval** before profiles go live
- Email/password auth with password reset
- Member directory (members-only) with search + role filters
- Editable YC-style member profiles (skills, "what I need" / "how I can help")
- 1:1 direct messaging with email notifications
- Events with RSVP (login required) + confirmation emails
- Admin dashboard: approve members, create/edit/delete events
- Referral links — each member has a unique `/join?ref=<id>` invite link

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env and fill in real values:

```bash
cp .env.example .env
```

You need, at minimum:

- `DATABASE_URL` — a PostgreSQL connection string (Supabase or Neon free tier).
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev.
- `RESEND_API_KEY` + `EMAIL_FROM` — for email. **Optional to start:** if the key
  is missing, emails are logged to the console instead of sent, so the app still
  runs end-to-end.

### 3. Set up the database

```bash
npm run db:push     # create tables from the Prisma schema
npm run db:seed     # optional: seed an admin + sample members/event
```

The seed creates an admin login:

```
admin@socaltechdiaspora.org  /  password123
```

**Change this password** (or delete the seed user) before going live.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to the database |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Making yourself an admin

Admins can approve members and manage events. To promote an existing user, open
Prisma Studio (`npm run db:studio`) and set their `isAdmin` field to `true`, or
run a quick query against your database.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add all `.env` variables in the Vercel project settings.
4. Set `NEXTAUTH_URL` to your production URL.
5. Verify your sending domain in Resend and update `EMAIL_FROM`.

If you hit a Prisma client error on Vercel, add a
`"postinstall": "prisma generate"` script so the client is generated on deploy.

## Notes / MVP scope

- **No LinkedIn API** — members paste a LinkedIn URL; nothing is auto-pulled.
- **No payments** — the community is free to join.
- **Single admin role** gates event creation and member approval.
- **Image uploads**: the profile photo field takes a URL for now. To add real
  uploads, wire up Vercel Blob or Supabase Storage (both free tier).
- The `.ics` calendar attachment on RSVP was left as a future nice-to-have.

## Project structure

```
app/
  page.tsx              Home
  mission/              Mission & values
  join/                 Membership application
  login/                Login
  forgot-password/      Password reset request
  reset-password/       Password reset form
  members/              Directory + [id] profile pages
  profile/              Edit your own profile
  messages/             Inbox + [userId] thread
  events/               Events list + [id] detail/RSVP
  dashboard/            Referral link + invitees
  admin/                Member approval + event management
  api/                  Route handlers (signup, auth, messages, rsvp, events, admin)
components/              Navbar, Footer, shared UI primitives
lib/                    prisma client, email, validations, message helpers
prisma/                 schema + seed
```
