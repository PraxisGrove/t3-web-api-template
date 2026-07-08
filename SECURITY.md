# Security Policy

## Supported Scope

This repository is a reusable application template. Security reports should focus on:

- insecure defaults in the template
- vulnerable dependency choices
- unsafe API, CORS, CSP, or rate-limit behavior
- CI, Docker, or deployment configuration issues
- documentation that could lead users to deploy insecurely

Application-specific vulnerabilities in projects generated from this template should be reported to those project owners.

## Reporting a Vulnerability

Do not open a public issue for sensitive security reports.

Use GitHub private vulnerability reporting if it is enabled for this repository. If it is not enabled, contact the repository owner through a private channel and include:

- affected file or configuration
- reproduction steps
- impact assessment
- suggested fix, if known
- whether the issue affects a fresh clone or only a modified downstream app

## Response Expectations

Maintainers should triage valid reports based on impact:

- Critical: actively exploitable remote code execution, credential exposure, or authentication bypass
- High: data exposure, unsafe default CORS, broken rate limiting, or injection risk
- Medium: hardening gaps or risky deployment guidance
- Low: documentation ambiguity or defense-in-depth improvements

Security fixes should include tests or verification steps when practical.

## Security Baseline

This template includes:

- global security headers
- a default Content Security Policy
- CORS allowlist support for REST endpoints
- REST rate limiting with optional Redis backing
- structured error responses for REST endpoints
- Dependabot dependency updates
- CodeQL code scanning

Production applications should still review authentication, authorization, secrets management, database access policy, and infrastructure settings for their own threat model.
