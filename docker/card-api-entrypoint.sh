#!/usr/bin/env sh
set -e

echo "[entrypoint] running prisma migrate deploy"
pnpm exec prisma migrate deploy

echo "[entrypoint] running idempotent seed"
pnpm db:seed || echo "[entrypoint] seed failed or already applied; continuing"

echo "[entrypoint] starting card-api"
exec node dist/main.js
