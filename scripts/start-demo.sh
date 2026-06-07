#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf '\n[FailBounty] Preparing demo environment...\n'

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
printf '[FailBounty] Open /programs, /programs/prog-refund-demo, /lab/prog-refund-demo, or /submissions\n\n'

npm run dev
