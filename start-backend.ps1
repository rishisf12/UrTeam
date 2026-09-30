# Start backend only (:8001) inside .venv. Run: .\start-backend.ps1. Ctrl+C to stop.
$ErrorActionPreference = "Stop"
$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$PY = "$ROOT\backend\.venv\Scripts\python.exe"
if (-not (Test-Path $PY)) {
  Write-Host "Creating backend .venv (one time)..."
  py -3.10 -m venv "$ROOT\backend\.venv"
  & "$ROOT\backend\.venv\Scripts\pip.exe" install -r "$ROOT\backend\requirements.txt"
}
if (-not (Test-Path "$ROOT\backend\.env")) {
  Copy-Item -Force "$ROOT\backend\.env.example" "$ROOT\backend\.env"
  Write-Host "Created backend/.env from example"
}
Set-Location "$ROOT\backend"
& $PY -m uvicorn backend.main:app --port 8001
