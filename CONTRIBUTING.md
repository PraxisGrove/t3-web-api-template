# Contributing

## Project Goal

This repository is a production-oriented T3 web API template. Changes should improve the default starting point for many projects, not only one application.

Default principles:

- keep web-internal APIs on `tRPC`
- keep mobile and external APIs on versioned `REST`
- keep shared validation in `zod` schemas
- keep shared business logic in `src/server/services`
- avoid adding auth providers by default
- prefer strong TypeScript boundaries over runtime guesswork

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:db
pnpm db:push
pnpm db:seed
pnpm dev
```

## Validation

Before opening a pull request, run:

```bash
pnpm verify
```

`pnpm verify` runs formatting/lint checks, TypeScript, tests, and production build sequentially. Do not run `pnpm typecheck` and `pnpm build` in parallel because Next.js rebuilds `.next/types`.

For targeted local cleanup:

```bash
pnpm fmt
pnpm lint
```

Run database validation when Prisma schema or seed data changes:

```bash
pnpm db:push
pnpm db:seed
```

## Pull Request Guidelines

Good template changes usually include:

- a clear reason the change belongs in the template
- updated README or setup docs for user-facing behavior
- `.env.example` updates for new configuration
- tests for reusable services, schemas, or security helpers
- OpenAPI updates when REST contracts change

Avoid:

- adding app-specific product logic
- adding a required SaaS provider unless the template can run without credentials
- introducing a second ORM or database
- weakening TypeScript checks to make implementation easier
- hiding required setup in undocumented environment variables

## Changelog and Releases

Add user-facing template changes to `CHANGELOG.md` under `## Unreleased`.

This repository uses date-based template releases:

- `vYYYY.MM.DD`
- `vYYYY.MM.DD.N` for multiple releases on the same day

Prepare a release with:

```bash
pnpm release:date
```

The `package.json` version is not the template release version.

## REST and tRPC Changes

When adding behavior used by both web and external clients:

- put business logic in `src/server/services`
- expose web-internal usage through `tRPC`
- expose mobile or external usage through `REST`
- reuse shared `zod` schemas where practical
- update OpenAPI when REST request or response shapes change

## Security Changes

Security-related changes should preserve local developer experience while keeping production defaults safe.

For new security controls, document:

- default behavior
- required environment variables
- local development behavior
- production behavior
- verification steps
