#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf '\n[FailBounty] Preparing demo environment...\n'

if command -v netstat >/dev/null 2>&1 && netstat -ano 2>/dev/null | grep -q ':3000.*LISTENING'; then
  printf '\n[FailBounty] Port 3000 is already in use.\n'
  printf 'Stop the existing Next.js server first, then rerun npm run start:demo.\n'
  printf 'If startup still fails, delete the .next folder and try again.\n\n'
  exit 1
fi

if [ "${FAILBOUNTY_CLEAR_NEXT:-}" = "1" ] && [ -d ".next" ]; then
  printf '[FailBounty] Clearing .next cache (FAILBOUNTY_CLEAR_NEXT=1).\n'
  rm -rf .next
fi

if [ ! -f ".env" ]; then
  printf '[FailBounty] No .env found. Creating local SQLite demo config.\n'
  cat > .env <<'EOF'
DATABASE_URL="file:./prisma/dev.db"
EOF
fi

npm run prisma:generate
npm run prisma:push
npm run db:seed

printf '\n[FailBounty] Demo is ready. Starting app on http://localhost:3000\n'
printf '[FailBounty] Open /programs, /programs/prog-workspace-copilot, /lab/prog-workspace-copilot, or /submissions\n\n'

npm run dev
