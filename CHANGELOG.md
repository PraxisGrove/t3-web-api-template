# Changelog

This template uses date-based release tags instead of package SemVer.

Tag format:

- `vYYYY.MM.DD`
- `vYYYY.MM.DD.N` for multiple releases on the same day

## Unreleased

- Enable the React Compiler and Turbopack Rust React Compiler in Next.js.

- Add React Doctor as a project dev dependency with an optional local `pnpm react-doctor` diagnostic command.

- Update compatible dependency releases, including Next.js 15.5.25, and patch vulnerable PostCSS/deepmerge-ts transitive dependencies with scoped overrides.
- Fix Docker package-manager installation, Prisma generation, executable Compose helper, and hook setup without Git; add a separate migration image/service before Compose app startup.
- Commit the initial Postgres migration, document existing-database baselining, and preserve the ID sequence when seeding.
- Apply shared rate limiting to every tRPC procedure invocation, including batches, require explicit trust of one sanitized proxy IP header, and fail closed on Redis errors/timeouts.
- Bound in-memory rate-limit storage, reclaim expired entries, and reject new identities at capacity without evicting active quotas.
- Validate migrations, dependency security, seeded API writes, and clean Docker deployments in CI; keep optional integrations credential-free by default.

- Add REST endpoint helpers for consistent rate limiting, validation, CORS, and structured errors.
- Tune Dependabot to only open npm version-update PRs for major dependency upgrades.
- Initial production-oriented T3 web API template.
