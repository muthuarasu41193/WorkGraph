# Sync ATS + Adzuna jobs into Supabase (same as: python -m app.main ingest --no-embed).
# Schedule with Windows Task Scheduler: Action = PowerShell, Arguments = -NoProfile -ExecutionPolicy Bypass -File "C:\path\to\landing\job_aggregator\scripts\run-ingest.ps1"
#
# Requires job_aggregator\.env (or repo-root .env.local) with SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL, or Postgres vars.

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
Set-Location $root

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Error "python not on PATH. Install Python 3.12+ or use the full path to python.exe."
}

& python -m app.main ingest --no-embed
exit $LASTEXITCODE
