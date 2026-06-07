$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host ""
Write-Host "[FailBounty] Preparing demo environment..."
Write-Host ""

if (-not (Test-Path ".env")) {
  Write-Host "[FailBounty] No .env found. Creating local SQLite demo config."
  'DATABASE_URL="file:./prisma/dev.db"' | Set-Content -Path ".env" -Encoding utf8
}

$portListener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($portListener) {
  Write-Host ""
  Write-Host "[FailBounty] Port 3000 is already in use." -ForegroundColor Red
  Write-Host "Stop the existing Next.js server first, then rerun npm run start:demo."
  Write-Host ""
  Write-Host "  netstat -ano | findstr :3000"
  Write-Host "  taskkill /PID <pid> /F"
  Write-Host ""
  Write-Host "If startup still fails, delete the .next folder and try again."
  Write-Host ""
  exit 1
}

if ($env:FAILBOUNTY_CLEAR_NEXT -eq "1" -and (Test-Path ".next")) {
  Write-Host "[FailBounty] Clearing .next cache (FAILBOUNTY_CLEAR_NEXT=1)."
  Remove-Item -Recurse -Force ".next"
}

npm run prisma:generate
npm run prisma:push
npm run db:seed

Write-Host ""
Write-Host "[FailBounty] Demo is ready. Starting app on http://localhost:3000"
Write-Host "[FailBounty] Open /programs, /programs/prog-workspace-copilot, /lab/prog-workspace-copilot, or /submissions"
Write-Host ""

npm run dev
