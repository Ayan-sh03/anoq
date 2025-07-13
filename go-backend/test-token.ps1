$BaseUrl = 'http://localhost:8080'
$token = '8ca216dd7e79ae525f09a44f264eaf320f65173963d7bb02701ff9f19cec4f40'
$headers = @{ 
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "Testing token: $token"
Write-Host "Headers: $($headers | ConvertTo-Json)"

try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/user" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "SUCCESS!"
    Write-Host "Response: $($result | ConvertTo-Json)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $streamReader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
} 