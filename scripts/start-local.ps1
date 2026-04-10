$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runDir = Join-Path $repoRoot ".codex-run"
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$backendPython = Join-Path $backendDir "venv\Scripts\python.exe"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

function Test-PortListening {
    param([int]$Port)

    try {
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Start-Backend {
    if (Test-PortListening -Port 8000) {
        Write-Host "Backend already listening on http://127.0.0.1:8000"
        return
    }

    if (-not (Test-Path $backendPython)) {
        throw "Backend venv Python not found at $backendPython"
    }

    & $backendPython -c "from app.db.init_db import init_db; init_db()" | Out-Host

    $backendOut = Join-Path $runDir "backend.out.log"
    $backendErr = Join-Path $runDir "backend.err.log"

    $process = Start-Process `
        -FilePath $backendPython `
        -ArgumentList "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000" `
        -WorkingDirectory $backendDir `
        -RedirectStandardOutput $backendOut `
        -RedirectStandardError $backendErr `
        -PassThru

    Write-Host "Backend started on http://127.0.0.1:8000 (PID $($process.Id))"
}

function Start-Frontend {
    if (Test-PortListening -Port 3000) {
        Write-Host "Frontend already listening on http://127.0.0.1:3000"
        return
    }

    $frontendOut = Join-Path $runDir "frontend.out.log"
    $frontendErr = Join-Path $runDir "frontend.err.log"
    $nodeOptions = if ($env:NODE_OPTIONS) { $env:NODE_OPTIONS } else { "--max-old-space-size=2048" }
    $frontendCommand = "`$env:NODE_OPTIONS='$nodeOptions'; npm.cmd run dev"

    $process = Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-Command", $frontendCommand `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $frontendOut `
        -RedirectStandardError $frontendErr `
        -PassThru

    Write-Host "Frontend started on http://127.0.0.1:3000 (PID $($process.Id))"
}

Start-Backend
Start-Frontend

Write-Host ""
Write-Host "Local app is ready for testing:"
Write-Host "  Frontend: http://127.0.0.1:3000"
Write-Host "  Backend:  http://127.0.0.1:8000"
Write-Host "  API docs: http://127.0.0.1:8000/docs"
