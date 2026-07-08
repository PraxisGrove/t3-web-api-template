# Agent Instructions

This repository is a production-oriented T3 web API template. Treat it as reusable infrastructure, not a one-off app.

## Core Rules

- Keep TypeScript strict and do not bypass type errors with `any`, unsafe casts, or disabled checks unless there is a documented reason.
- Keep validation at runtime boundaries with `zod`.
- Keep shared business logic in `src/server/services`.
- Keep web-internal API calls on `tRPC`.
- Keep mobile, public, webhook, and third-party API calls on versioned `REST`.
- Keep REST request and response shapes represented in OpenAPI.
- Do not add a second ORM or database. This template uses `Prisma + Postgres`.
- Do not install an auth provider by default. Clerk is intentionally reserved for later integration.
- Do not commit secrets, project IDs, Vercel IDs, Sentry tokens, or production database URLs.

## Commands

Use these commands:

- `pnpm fmt` to format files.
- `pnpm lint` to run lint checks only.
- `pnpm check` to run Biome's combined read-only check.
- `pnpm verify` before handoff or pull request.

`pnpm verify` runs formatting/lint checks, typecheck, tests, and production build sequentially. Do not run `pnpm typecheck` and `pnpm build` in parallel because Next.js rebuilds `.next/types`.

## API Boundaries

When adding a feature used by both web and external clients:

1. Add or update the shared `zod` schema.
2. Put reusable logic in `src/server/services`.
3. Expose internal web usage through `tRPC`.
4. Expose mobile or public usage through `REST`.
5. Update OpenAPI for REST contract changes.
6. Add tests for schemas, services, or security helpers.

## Security

- Keep CORS explicit through `ALLOWED_ORIGINS`.
- Keep REST endpoints behind the shared rate-limit helper.
- Use structured REST errors; do not leak internal error details.
- Keep production migrations separate from Vercel builds.
- Use GitHub Environments and secrets for production `DATABASE_URL`.

## Template Discipline

- Prefer optional integrations over required SaaS credentials.
- Update `.env.example` whenever adding env vars.
- Update README or docs for user-facing behavior.
- Add user-facing template changes to `CHANGELOG.md` under `## Unreleased`.
- Keep host-specific absolute paths out of committed files.
