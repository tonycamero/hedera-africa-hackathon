# Test secure HCS submission
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$body = @{
    type = "RECOGNITION_MINT"
    from = "0.0.5864857"
    nonce = $timestamp
    ts = $timestamp
    payload = @{
        recognition = "Prof Fav"
        to = "alex-chen-demo-session-2024"
        definitionId = "prof-fav"
        name = "Prof Fav"
        mintedBy = "demo-network"
    }
} | ConvertTo-Json

Write-Host "Testing secure HCS submission..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/hcs/submit" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SUCCESS:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}