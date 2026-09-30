# Start frontend only (:5173). Run: .\start-frontend.ps1. Ctrl+C to stop.
$ErrorActionPreference = "Stop"
$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path "$ROOT\frontend\.env")) {
  Copy-Item -Force "$ROOT\frontend\.env.example" "$ROOT\frontend\.env"
  Write-Host "Created frontend/.env from example"
}
if (-not (Test-Path "$ROOT\frontend\node_modules")) {
  Write-Host "Installing frontend deps (one time)..."
  Push-Location "$ROOT\frontend"
  npm install
  Pop-Location
}
Set-Location "$ROOT\frontend"
npm run dev
