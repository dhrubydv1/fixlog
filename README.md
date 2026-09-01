# FixLog

FixLog is a full-stack application for saving programming problems, errors, causes, and solutions so developers can find them later.

## What FixLog Does

FixLog turns useful debugging knowledge into searchable records. Each **Fix** captures the problem, any error message, the cause, the solution, tags, and timestamps. Developers can browse their saved fixes, open a detailed view, and keep the information up to date.

## Features

- Add a Fix with title, problem, error message, cause, solution, and tags
- Persist fixes in PostgreSQL
- View all fixes, newest first
- Search fixes by title, problem, error message, or tags
- View a dedicated details page for each Fix
- Edit an existing Fix
- Delete a Fix with a confirmation prompt
- REST-style API for creating, reading, updating, and deleting fixes

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma ORM](https://www.prisma.io/)
- Prisma PostgreSQL adapter (`@prisma/adapter-pg`) and `pg`
- Tailwind CSS

## Project Architecture

```text
app/
├── api/
│   └── fixes/
│       ├── route.ts          # GET all fixes and POST a new fix
│       └── [id]/route.ts     # PATCH and DELETE one fix
├── fixes/
│   └── [id]/page.tsx         # Server-rendered Fix details page
├── layout.tsx                # Root HTML layout and global styles
└── page.tsx                  # Client-side FixLog homepage and UI

lib/
└── prisma.ts                 # Reusable, development-safe Prisma Client

prisma/
├── schema.prisma             # Prisma data model
└── migrations/               # Versioned database migrations

prisma7.config.ts             # Prisma CLI configuration and DATABASE_URL source
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/fixes` | Return all fixes, newest first. |
| `POST` | `/api/fixes` | Create a new fix. Requires `title`, `problem`, and `solution`. |
| `PATCH` | `/api/fixes/{id}` | Update an existing fix. Requires `title`, `problem`, and `solution`. |
| `DELETE` | `/api/fixes/{id}` | Delete a fix by ID. |

The individual details page is available at `/fixes/{id}`, for example `/fixes/2`.

## Database Structure

The Prisma `Fix` model maps to the Fix table in PostgreSQL.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Integer | Primary key; assigned automatically. |
| `title` | String | Required summary of the fix. |
| `problem` | String | Required description of the issue. |
| `errorMessage` | String? | Optional error output or message. |
| `cause` | String? | Optional root cause. |
| `solution` | String | Required solution or steps taken. |
| `tags` | String? | Optional searchable tags. |
| `createdAt` | DateTime | Set automatically when created. |
| `updatedAt` | DateTime | Updated automatically when changed. |

## Local Development Setup

### Prerequisites

- Node.js 20.19 or later
- npm
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create the PostgreSQL database

With PostgreSQL running, create a local database named `fixlog`:

```bash
createdb fixlog
```

If you prefer to use the PostgreSQL shell:

```sql
CREATE DATABASE fixlog;
```

### 3. Configure environment variables

Create a local `.env` file and set `DATABASE_URL`. Never commit this file or use a real password in documentation.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fixlog?schema=public"
```

Replace `USER` and `PASSWORD` with your own local PostgreSQL credentials. Passwords containing special characters must be URL encoded.

### 4. Apply Prisma migrations

Apply the versioned migrations to your local `fixlog` database:

```bash
npx prisma migrate dev --config prisma7.config.ts
```

If the generated Prisma Client is missing or the schema changes later, generate it with:

```bash
npx prisma generate --config prisma7.config.ts
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |

Example only:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fixlog?schema=public"
```

Do not commit `.env` or share a real connection string containing credentials.

## Useful PostgreSQL Commands

```bash
# Open PostgreSQL's interactive shell.
psql -d postgres

# List databases (run inside psql).
\l

# Connect to the FixLog database (run inside psql).
\c fixlog

# List tables in the current database (run inside psql).
\dt

# List saved fixes (run inside psql).
SELECT * FROM "Fix" ORDER BY "createdAt" DESC;
```

To create the database from the shell:

```sql
CREATE DATABASE fixlog;
```

## What I Learned

- How Next.js App Router maps files and folders to pages and API routes
- How Client Components use React state, effects, forms, and `fetch`
- How Server Components can safely query a database without exposing credentials to the browser
- How dynamic routes such as `/fixes/[id]` use URL parameters
- How Prisma models, migrations, and Prisma Client map TypeScript code to PostgreSQL data
- How REST-style HTTP methods (`GET`, `POST`, `PATCH`, and `DELETE`) support CRUD operations
- How to keep a Prisma Client reusable during Next.js development and hot reloads

## Future Improvements

- User authentication and per-user fixes
- Pagination and server-side search for larger datasets
- Tag normalization and tag filters
- Rich text or Markdown support for solutions
- Better form validation and success notifications
- Sorting and filtering controls
- Tests for API routes and UI behavior
- Deployment configuration and production database setup
- Audit history or soft deletes for recovered fixes
