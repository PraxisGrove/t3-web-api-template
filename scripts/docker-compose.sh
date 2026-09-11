#!/usr/bin/env bash
set -euo pipefail

if docker compose version >/dev/null 2>&1; then
  docker compose "$@"
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose "$@"
else
  echo "Docker Compose is required. Install Docker Desktop or the docker compose plugin." >&2
  exit 1
fi
