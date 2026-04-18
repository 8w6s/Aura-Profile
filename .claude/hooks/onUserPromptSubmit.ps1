# .claude/hooks/onUserPromptSubmit.ps1
# Hook được gọi mỗi khi user submit prompt
# Gửi prompt đến orchestrator để phân tích và điều phối

$hookInput = [Console]::In.ReadToEnd()
try {
    $data = $hookInput | ConvertFrom-Json
    $prompt = $data.prompt
    $cwd = Get-Location

    # POST to orchestrator
    $body = @{
        prompt = $prompt
        cwd = $cwd.Path
    } | ConvertTo-Json

    # Fix 1: Thêm timeout 2s để tránh block lâu
    $response = Invoke-RestMethod -Method Post `
        -Uri "http://127.0.0.1:8081/orchestrate" `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 2 `
        -ErrorAction SilentlyContinue

    # Fix 2: Validate response trước khi truy cập property
    if ($response -and $response.session_id) {
        Write-Output "[Orchestrator] Session: $($response.session_id)"
    }
} catch {
    # Fix 3: Log error để debug, nhưng vẫn silent fail cho UX
    $logDir = Join-Path $HOME ".claude\logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $logFile = Join-Path $logDir "orchestrator.log"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [ERROR] $($_.Exception.Message)" | Out-File -Append -FilePath $logFile
}
