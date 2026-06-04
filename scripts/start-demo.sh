#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf '\n[FailBounty] Preparing demo environment...\n'
npm run prisma:generate
npm run prisma:push
npm run db:seed

printf '\n[FailBounty] Demo is ready. Starting app on http://localhost:3000\n'
printf '[FailBounty] Open /, /board, /lab?programId=prog-refund-demo, or /verifier\n\n'

npm run dev
