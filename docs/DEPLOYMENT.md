# FixLog deployment

## Local versus production

Local development can use `BETTER_AUTH_URL=http://localhost:3000`. Production must use the final HTTPS deployment URL so Better Auth callbacks and links resolve correctly.

Required production variables:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
RESEND_API_KEY
OPENROUTER_API_KEY
OPENROUTER_MODEL
ADMIN_EMAILS
```

Never commit these values or print them in logs.

## Vercel

1. Import the GitHub repository into Vercel.
2. Add the variables above to the correct production environment.
3. Set `BETTER_AUTH_URL` to the deployed HTTPS URL.
4. Confirm `DATABASE_URL` targets the intended Neon PostgreSQL database.
5. Deploy the main branch.
6. Verify `/auth`, `/dashboard`, `/community`, and `/admin/reports` with disposable accounts.

## Prisma and Neon

The repository uses Prisma 7 configuration in `prisma7.config.ts` and tracks migrations under `prisma/migrations`.

```bash
npx prisma generate --config prisma7.config.ts
npx prisma migrate status --config prisma7.config.ts
```

Review migration status before applying any migration. Do not manually edit Neon records or run ad-hoc SQL as part of deployment.

## Email

Resend uses the development sender `onboarding@resend.dev` in the current implementation. Resend’s testing sender may restrict arbitrary recipients; a verified custom sending domain is recommended for production delivery.
