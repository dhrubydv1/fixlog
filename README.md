# FixLog

FixLog is a private developer memory and community knowledge base for saving, searching, and sharing real debugging fixes.

It helps developers preserve solved bugs and errors, search their own history, get AI-assisted documentation suggestions, publish selected fixes, and discover useful public fixes from other developers.

## Features

### Private workspace

- Create, edit, and delete Fixes
- Categories, tags, and favorites
- Search, filtering, and sorting
- Similar Fix suggestions from saved Fixes
- AI-assisted Fix documentation suggestions
- AI semantic search across the private workspace
- Dashboard statistics

### Community

- Private/Public Fix visibility (private by default)
- Public, read-only Fix pages
- Authenticated Community Search
- Public Community Hub with trending and most-helpful sections
- Save a public Fix to your own workspace
- Helpful votes
- Public developer profiles
- Private Fix reporting
- Admin moderation queue
- Notifications for community activity and moderation

### Account

- Better Auth login and signup
- Email verification
- Forgot/reset password
- Change password and session management
- Profile/settings
- Account deletion

## Tech stack

- Next.js `16.3.3` App Router
- React `19.2.8`
- TypeScript `^5`
- Prisma `^7.10.0` with `@prisma/adapter-pg`
- PostgreSQL hosted on Neon
- Better Auth `^1.7.2`
- OpenRouter (server-side AI requests)
- Resend `^6.26.0` (verification and password-reset email)
- Tailwind CSS `^4`
- Vercel deployment

## Architecture

```text
Browser
  ↓
Next.js App Router
  ├─ Better Auth
  ├─ Server Components / API Route Handlers
  │    ↓
  │  Prisma Client
  │    ↓
  │  Neon PostgreSQL
  ├─ AI route → server-only OpenRouter fetch
  └─ Better Auth email callbacks → server-only Resend helper
```

Browser code never receives provider credentials. Ownership, visibility, and admin checks are enforced on the server.

More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security and privacy

- Every Fix belongs to its owning user through `userId`.
- Private Fixes are excluded from all community queries server-side.
- Public visibility is required for public pages, community actions, and community ranking.
- Only the owner can edit, delete, favorite, or change visibility on a Fix.
- Community actions require authentication where appropriate.
- Admin access is controlled server-side by the comma-separated `ADMIN_EMAILS` allowlist.
- Public pages expose only safe Fix content and an optional display name; they do not expose email, sessions, accounts, passwords, or auth metadata.
- Copies saved from the community are new Fixes owned by the recipient and default to private.
- Reports are private system data and are visible only to authorized admins.

See [docs/SECURITY.md](docs/SECURITY.md).

## Required environment variables

Use placeholders locally and configure real values through your deployment platform. Never commit `.env` or secret values.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="your-openrouter-model"
ADMIN_EMAILS="admin@example.com"
```

Production `BETTER_AUTH_URL` must be the deployed HTTPS URL, not localhost. Resend’s testing sender may restrict arbitrary-recipient delivery until a verified sending domain is configured.

## Local setup

```bash
git clone <repository-url>
cd fixlog
npm install
```

Create a `.env` file with the variables above, using a local PostgreSQL or Neon connection string.

Generate the Prisma Client and inspect migration state:

```bash
npx prisma generate --config prisma7.config.ts
npx prisma migrate status --config prisma7.config.ts
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Prisma migrations are versioned under `prisma/migrations`. Applying migrations is an environment/deployment decision; do not run migration commands against production without reviewing pending status first.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/auth` | Login and signup |
| `/dashboard` | Private Fix workspace |
| `/settings` | Account and profile settings |
| `/notifications` | Private notification inbox |
| `/community` | Public Community Hub |
| `/community/fixes/[id]` | Public Fix detail |
| `/community/users/[id]` | Public developer profile |
| `/admin/reports` | Admin moderation queue |

## Database and migrations

The Prisma schema is in `prisma/schema.prisma`; versioned migrations are in `prisma/migrations`. The migration history covers authentication tables, Fix ownership, categories/favorites, visibility, helpful votes, reports, report status, and notifications.

## Screenshots

### Landing

![FixLog Landing Page](docs/screenshots/landing.png)

### Dashboard

![FixLog Dashboard](docs/screenshots/dashboard.png)

### Community

![FixLog Community Hub](docs/screenshots/community.png)

### Public Fix

![Public Fix detail](docs/screenshots/public-fix.png)

### Settings

![FixLog Settings](docs/screenshots/settings.png)

### Admin Moderation

![FixLog Admin Moderation](docs/screenshots/admin-reports.png)

## Testing

```bash
npm run lint
npx tsc --noEmit
npm run test -- tests/notifications.test.mjs
npm run build
```

Manual release checks should cover two-user ownership and visibility, community actions, admin authorization, AI provider errors, email flows, keyboard accessibility, and responsive layouts.

See [docs/TESTING.md](docs/TESTING.md).

## Deployment

1. Connect the repository to Vercel.
2. Add all production environment variables without exposing their values in git.
3. Set `BETTER_AUTH_URL` to the final HTTPS deployment URL.
4. Confirm `DATABASE_URL` points to the intended Neon database.
5. Generate Prisma Client during install/build and review migration status before applying any pending migration.
6. Configure Resend’s verified sending domain when production email delivery requires arbitrary recipients.
7. Deploy the main branch and verify authentication, public visibility, and admin access with disposable accounts.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
