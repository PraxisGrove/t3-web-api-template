# Vercel Deployment

This template is ready for Vercel, but it intentionally does not include project IDs, team IDs, or secrets.

## Import Settings

Use these settings when importing the repository into Vercel:

- Framework preset: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: leave empty
- Root directory: repository root

These are also captured in `vercel.json`.

## Required Environment Variables

Set these in Vercel for Production, Preview, and Development environments:

```bash
DATABASE_URL=""
APP_ENV="production"
NEXT_PUBLIC_APP_ENV="production"
LOG_LEVEL="info"
ALLOWED_ORIGINS="https://your-domain.com"
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_REQUESTS="60"
RATE_LIMIT_WINDOW_SECONDS="60"
```

`DATABASE_URL` must point to a production Postgres database. Use a provider that supports serverless Next.js workloads, such as Vercel Postgres, Neon, Supabase, or a managed Postgres service with pooling.

## Optional Environment Variables

Rate limiting with Redis:

```bash
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

Sentry:

```bash
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
SENTRY_AUTH_TOKEN=""
SENTRY_TRACES_SAMPLE_RATE="0.1"
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE="0.1"
```

PostHog:

```bash
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

## Database Migrations

Do not run Prisma migrations automatically during Vercel builds by default.

Recommended production flow:

```bash
pnpm db:migrate
```

Run migrations from a controlled CI job, release process, or local operator machine with production database access. Keep Vercel builds focused on compiling and deploying the application.

This template includes `.github/workflows/db-migrate.yml` for manual production migrations.

Recommended setup:

1. Create a GitHub Environment named `production`.
2. Add a `DATABASE_URL` secret to that environment.
3. Add required reviewers to the environment if this is a real production database.
4. Run the `DB Migrate` workflow manually.
5. Select the environment and type `migrate` to confirm.

The workflow runs `pnpm db:migrate`, which maps to `prisma migrate deploy`.

## CORS

Set `ALLOWED_ORIGINS` to the public web origin and any trusted API clients:

```bash
ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
```

An empty value means REST routes only serve same-origin or browserless requests without CORS headers.

## Build Validation

Before deploying, run:

```bash
pnpm verify
```

For local Docker image builds without production envs, use `SKIP_ENV_VALIDATION=1`. Do not use that as a production default on Vercel.

## After First Deploy

Verify:

- `/api/v1/openapi.json` returns the REST contract
- `/api/v1/posts` returns JSON
- Sentry receives errors if DSNs are configured
- PostHog receives events if the public key is configured
- REST rate limiting uses Upstash when Redis envs are configured
