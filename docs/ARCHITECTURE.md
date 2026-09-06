# FixLog architecture

## Application structure

- `app/` contains Next.js App Router pages, layouts, client components, and route handlers.
- `app/api/` contains authenticated Fix, AI, community, notification, and admin endpoints.
- `lib/auth.ts` configures Better Auth and its email callbacks.
- `lib/auth-client.ts` exposes the browser-side Better Auth client.
- `lib/prisma.ts` creates the Prisma 7 client with the PostgreSQL adapter.
- `lib/ai.ts` is the server-only OpenRouter abstraction and response sanitizer.
- `lib/email.ts` is the server-only Resend helper.
- `prisma/schema.prisma` and `prisma/migrations/` define the database contract.

## Core data flow

```text
Browser → Next.js App Router → session/ownership checks → Prisma → Neon PostgreSQL
```

Fix reads and writes are scoped by the authenticated user. Community reads additionally require `visibility = PUBLIC`.

## AI flow

```text
Dashboard → POST /api/ai/fix-suggestions or /api/ai/search
         → authenticated route
         → lib/ai.ts
         → OpenRouter (server-side)
         → validated/sanitized JSON
         → browser review
```

AI suggestions never write directly to the database. The user reviews and saves through normal Fix CRUD.

## Email flow

```text
Better Auth verification/reset callback → lib/email.ts → Resend
```

`RESEND_API_KEY` is read only on the server.

## Community flow

Public pages query only public Fixes. Authenticated users can save a public Fix as a new private Fix, vote helpful, or submit a private report. Admin moderation re-checks the server-side admin allowlist before changing visibility or deleting a Fix.
