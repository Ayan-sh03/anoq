$body = @{
    user = @{
        id = "kinde_123456789"
        email = "test@example.com"
        given_name = "Test"
        family_name = "User"
    }
    type = "user.created"
} | ConvertTo-Json

Write-Host "Sending payload:"
Write-Host $body

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/sync-user" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    Write-Host "Response:"
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
    Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body:" $responseBody
    }
} 