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

    $response = Invoke-RestMethod -Method Post `
        -Uri "http://127.0.0.1:8081/orchestrate" `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction SilentlyContinue

    if ($response.session_id) {
        Write-Output "[Orchestrator] Session: $($response.session_id)"
    }
} catch {
    # Silent fail - không block user prompt
}
