# Start frontend (:5173). RUN the file: .\start.ps1 (do not paste it). Ctrl+C to stop.
$ErrorActionPreference = "Stop"
$HERE = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path "$HERE\.env")) {
  Copy-Item -Force "$HERE\.env.example" "$HERE\.env"
  Write-Host "Created .env from example"
}
Set-Location $HERE
npm run dev
