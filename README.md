# T3 Web API Template

Production-oriented T3 starter for a split-platform setup:

- Web app uses `Next.js + tRPC`
- Mobile clients use versioned `REST`
- Data layer uses `Prisma + Postgres`
- Styling uses `Tailwind CSS`
- Observability uses `Sentry + pino`
- Product analytics uses `PostHog`
- CI uses GitHub Actions
- Dependency updates use Dependabot
- Code scanning uses GitHub CodeQL
- Issue and PR templates are included for GitHub maintenance
- Security and contribution policies are included
- AI agent instructions are included
- Date-based template releases are documented and automated
- Vercel deployment configuration is included
- Local Git hooks use `lefthook`
- Docker includes Postgres-only and full app compose paths
- REST security includes CORS, security headers, and rate limiting
- Auth is intentionally not preinstalled so you can add `Clerk` later

## Why this template exists

This template is for teams that want strong TypeScript constraints in web code without forcing mobile clients onto `tRPC`.

Default project rule:

- Internal web features call `tRPC`
- Mobile apps or third-party clients call `REST`
- Shared validation lives in `zod` schemas
- Shared business logic lives in service modules

That keeps web DX strong while preserving a clean mobile boundary.

## Generated with

This project was scaffolded with the official T3 CLI:

```bash
pnpm dlx create-t3-app@latest t3-web-api-template \
  --CI true \
  --tailwind true \
  --nextAuth false \
  --betterAuth false \
  --prisma true \
  --drizzle false \
  --trpc true \
  --dbProvider postgres \
  --appRouter true \
  --biome true
```

## Stack choices

- `Next.js` App Router
- `tRPC` for internal web-only procedures
- `Prisma` as the only ORM
- `Postgres` as the default database
- `Biome` for formatting and lint checks
- `Tailwind CSS` for UI styling
- `Sentry` for error and performance reporting
- `pino` for structured server logs
- `PostHog` for optional product analytics
- GitHub Actions for install, database sync, lint, typecheck, and build
- Dependabot for dependency, GitHub Actions, and Docker image updates
- CodeQL for JavaScript and TypeScript security scanning
- GitHub Issue and PR templates for template maintenance
- `SECURITY.md` and `CONTRIBUTING.md` for repository governance
- `AGENTS.md` for AI coding-agent guardrails
- Date-based release tags and changelog workflow
- Vercel deployment defaults and documentation
- Manual database migration workflow for production changes
- `lefthook` for local pre-commit and pre-push checks
- Docker Compose for local Postgres and optional full app containers
- Security headers, CORS allowlist, and REST rate limiting
- No built-in auth package

## Included examples

### tRPC

- `src/server/api/routers/post.ts`
- `src/app/api/trpc/[trpc]/route.ts`

Use this path for:

- dashboard features
- backoffice screens
- internal product surfaces that live in the same TypeScript codebase

### REST

- `src/app/api/v1/posts/route.ts`
- `src/app/api/v1/openapi.json/route.ts`

Use this path for:

- mobile apps
- public APIs
- webhooks
- third-party integrations

REST contract:

```bash
curl http://localhost:3000/api/v1/openapi.json
```

Mobile apps and other non-TypeScript clients should use the OpenAPI document as the source of truth for REST request and response shapes.

REST routes should use `createRestQuery` or `createRestMutation` from `src/server/rest/endpoint.ts`. Those helpers keep rate limiting, JSON parsing, `zod` validation, CORS, structured errors, and unexpected-error handling consistent across versioned REST endpoints.

## Project structure

```text
src/
  instrumentation.ts
  instrumentation-client.ts
  app/
    api/
      trpc/[trpc]/route.ts
      v1/openapi.json/route.ts
      v1/posts/route.ts
    global-error.tsx
  server/
    api/
    db.ts
    observability/
      analytics.ts
      logger.ts
    openapi/
      document.ts
    rest/
      endpoint.ts
    services/
      post.ts
      post.schema.ts
```

The important boundary is that both API layers can call the same service code.

## Local setup

1. Copy envs:

```bash
cp .env.example .env
```

2. Start Postgres.

Recommended local path:

```bash
pnpm docker:db
```

You can also use your own local Postgres.

3. Create schema:

```bash
pnpm db:push
pnpm db:seed
```

4. Start dev server:

```bash
pnpm dev
```

## Smoke test

REST:

```bash
curl http://localhost:3000/api/v1/posts
curl -X POST http://localhost:3000/api/v1/posts \
  -H "content-type: application/json" \
  -d '{"name":"Hello from REST"}'
```

Checks:

```bash
pnpm fmt
pnpm lint
pnpm verify
```

Reset local database:

```bash
pnpm db:reset
```

## Docker

This template provides two Docker paths.

Recommended local development path:

```bash
pnpm docker:db
pnpm db:push
pnpm dev
```

This keeps Next.js on the host for fast file watching and hot reload, while Postgres runs in Docker.

Optional full container path:

```bash
pnpm docker:app
```

This builds the Next.js standalone output and runs it with Postgres. Use this when you want to test container packaging or self-hosted deployment behavior.

The `docker:*` scripts use `scripts/docker-compose.sh`, which supports both `docker compose` and `docker-compose`.

## Vercel Deployment

The template includes `vercel.json` with the Next.js preset, pnpm frozen install, and `pnpm build`.

Deployment notes:

- Set `DATABASE_URL` in Vercel before building.
- Do not run Prisma migrations automatically during Vercel builds.
- Set `ALLOWED_ORIGINS` to your production domain.
- Configure optional Sentry, PostHog, and Upstash envs only when you use those services.

See `docs/deployment/vercel.md` for the full environment checklist and deployment flow.

## Observability

This template includes three production defaults:

- `Sentry` captures frontend, server, and edge runtime errors when DSNs are configured.
- `pino` writes structured server logs for API routes, tRPC middleware, and services.
- `PostHog` captures product events when `NEXT_PUBLIC_POSTHOG_KEY` is configured.

All vendor envs are optional. A fresh clone runs locally without Sentry or PostHog credentials.

Relevant files:

- `src/instrumentation.ts`
- `src/instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `src/server/observability/logger.ts`
- `src/server/observability/analytics.ts`

## Security

This template includes secure defaults for the web and REST boundary:

- Global security headers are set in `next.config.js`.
- REST CORS defaults to same-origin/browserless requests.
- REST responses use a consistent error shape.
- REST endpoints are rate limited.
- Rate limiting uses Upstash Redis when configured and falls back to in-memory limits locally.

Security envs:

```bash
ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_REQUESTS="60"
RATE_LIMIT_WINDOW_SECONDS="60"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

Use Redis-backed rate limiting for production. The in-memory fallback is for local development and single-process deployments only.

## CI

The template includes `.github/workflows/ci.yml`.

It runs on pushes to `main` and pull requests:

- `pnpm install --frozen-lockfile`
- `prisma generate`
- `pnpm db:push` against a Postgres service
- `pnpm db:seed`
- `pnpm verify`

The template also includes `.github/workflows/db-migrate.yml` for manual Prisma production migrations. Configure a GitHub Environment with a `DATABASE_URL` secret, then run the workflow manually and type `migrate` to confirm.

## Dependency Updates

The template includes `.github/dependabot.yml`.

Dependabot checks weekly updates for:

- `npm` dependencies managed by `pnpm-lock.yaml`
- GitHub Actions used by CI
- Docker base images

Minor and patch updates are grouped to reduce noisy maintenance PRs.

## Code Scanning

The template includes `.github/workflows/codeql.yml`.

CodeQL scans JavaScript and TypeScript code on pull requests, pushes to `main`, and a weekly schedule. It uses GitHub's `security-extended` and `security-and-quality` query suites.

## GitHub Templates

The template includes issue forms for bug reports, feature requests, and template improvements. It also includes a pull request template with validation and template-impact checklists.

## Repository Governance

The template includes:

- `SECURITY.md` for vulnerability reporting scope and security baseline
- `CONTRIBUTING.md` for local setup, validation, and template contribution rules
- `AGENTS.md` for AI coding-agent rules and project boundaries

## Date Releases

This template uses date-based release tags for template snapshots:

- `vYYYY.MM.DD`
- `vYYYY.MM.DD.N` for multiple releases on the same day

The package version stays as a private project placeholder. Do not use `package.json` version as the template release version.

Release flow:

```bash
pnpm release:date
git add CHANGELOG.md
git commit -m "Prepare vYYYY.MM.DD"
git tag vYYYY.MM.DD
git push origin main --tags
```

Use `RELEASE_DATE=YYYY-MM-DD pnpm release:date` to prepare a specific date.

GitHub creates the release from `.github/workflows/release.yml` when a matching date tag is pushed.

## Local Git Hooks

`lefthook` is installed by the `prepare` script after dependencies are installed.

Default hooks:

- `pre-commit`: runs `pnpm check:write` and `pnpm test`
- `pre-push`: runs `pnpm verify`

## Adding Clerk later

This template leaves auth open on purpose.

When you add Clerk, update:

- `.env.example`
- `src/env.js`
- route protection and middleware
- API procedures that need auth-aware context

Keep Clerk at the app boundary. Do not push auth logic into Prisma services.

## Template conventions

- One ORM only
- One database only
- Internal web traffic prefers `tRPC`
- External and mobile traffic prefers versioned `REST`
- Put reusable business logic in `src/server/services`

## Upstream docs

- [T3](https://create.t3.gg/)
- [Next.js](https://nextjs.org/docs)
- [tRPC](https://trpc.io/docs)
- [Prisma](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Biome](https://biomejs.dev/guides/getting-started/)
