# TeamPilot dev launcher. Run from project3_teampilot/.
# Opens backend (:8001) and frontend (:5173) in two windows. Ctrl+C in each to stop.
$ErrorActionPreference = "Stop"
$ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

# Ensure env files exist (first run)
if (-not (Test-Path "$ROOT\backend\.env")) {
  Copy-Item -Force "$ROOT\backend\.env.example" "$ROOT\backend\.env"
  Write-Host "Created backend/.env from example"
}
if (-not (Test-Path "$ROOT\frontend\.env")) {
  Copy-Item -Force "$ROOT\frontend\.env.example" "$ROOT\frontend\.env"
  Write-Host "Created frontend/.env from example"
}

# Frontend deps on first run
if (-not (Test-Path "$ROOT\frontend\node_modules")) {
  Write-Host "Installing frontend deps (one time)..."
  Push-Location "$ROOT\frontend"
  npm install
  Pop-Location
}

# Backend window (.venv)
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$ROOT\backend'; if (-not (Test-Path '.venv')) { py -3.10 -m venv .venv; .\.venv\Scripts\pip.exe install -r requirements.txt }; .\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8001"
)

# Frontend window
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$ROOT\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Backend:  http://localhost:8001/docs"
Write-Host "Frontend: http://localhost:5173"
