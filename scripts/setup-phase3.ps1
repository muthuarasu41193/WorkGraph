# WorkGraph Phase 3 — one-shot local setup (Windows PowerShell)
# Run from repo root: .\scripts\setup-phase3.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Copying environment files..."
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.workgraph.example" ".env.local"
}
if (-not (Test-Path ".env")) {
  Copy-Item ".env.workgraph.example" ".env"
}

Write-Host "==> Starting Docker (postgres, redis, minio, typesense, api)..."
docker compose -f infrastructure/docker-compose.yml up -d postgres redis minio typesense api

Write-Host "==> Installing npm dependencies..."
npm install

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. npm run dev          -> http://localhost:3000"
Write-Host "  2. Add Supabase keys to .env.local, then sign up at /signup"
Write-Host "  3. Create profile       -> /create-profile"
Write-Host "  4. Dashboard            -> /profile (Community + Wallet tabs)"
Write-Host ""
Write-Host "Services:"
Write-Host "  API:          http://localhost:8000/docs"
