# Start orchestrator HTTP server
# Usage: .\start_orchestrator.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $scriptDir "orchestrator_server.py"
$logFile = Join-Path $scriptDir "orchestrator_server.log"

Write-Host "[orchestrator] Starting HTTP server on port 8081..." -ForegroundColor Green

# Start server in background
Start-Process python3 -ArgumentList $serverScript -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $logFile

Start-Sleep -Seconds 2

# Test if server is running
try {
    $response = Invoke-WebRequest "http://127.0.0.1:8081/health" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "[orchestrator] Server started successfully" -ForegroundColor Green
        Write-Host "[orchestrator] Endpoints available:" -ForegroundColor Cyan
        Write-Host "  POST http://127.0.0.1:8081/orchestrate" -ForegroundColor White
        Write-Host "  GET  http://127.0.0.1:8081/status/{session_id}" -ForegroundColor White
        Write-Host "  GET  http://127.0.0.1:8081/health" -ForegroundColor White
    }
} catch {
    Write-Host "[orchestrator] Failed to start server. Check $logFile for details." -ForegroundColor Red
    exit 1
}
