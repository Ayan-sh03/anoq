# AnoQ Backend API Comprehensive Test Suite
# Tests all endpoints with the new session-based auth system.

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$OutputFile = "test-results.md"
)

# Global variables
$script:TestResults = @()
$script:TestCount = 0
$script:PassCount = 0
$script:FailCount = 0
$script:IssuesFound = @()

# Test data storage
$script:RegisteredEmail = "test" + $(Get-Random -Maximum 1000000) + "@example.com"
$script:RegisteredPassword = "password123"
$script:CreatedUserID = $null
$script:AuthToken = $null
$script:CreatedFormID = $null
$script:CreatedFormSlug = $null
$script:CreatedQuestionIDs = @()
$script:CreatedResponseID = $null

# Helper Functions
function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
    Add-Content $OutputFile "`n## $Title`n"
}

function Write-TestCase {
    param(
        [string]$TestName, 
        [string]$Status, 
        [string]$Details, 
        [string]$Issues = ""
    )
    $script:TestCount++
    
    if ($Status -eq "PASS") {
        $script:PassCount++
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        $script:FailCount++
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Issues) {
            $script:IssuesFound += "**$TestName**: $Issues"
        }
    }
    
    $script:TestResults += @{
        Name = $TestName
        Status = $Status
        Details = $Details
        Issues = $Issues
    }
    
    Add-Content $OutputFile "### $TestName - $Status`n"
    Add-Content $OutputFile "$Details`n"
    if ($Issues) {
        Add-Content $OutputFile "**Issues Found**: $Issues`n"
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    try {
        $uri = "$BaseUrl$Endpoint"
        
        # Ensure we always have content-type header
        if (-not $Headers.ContainsKey("Content-Type")) {
            $Headers["Content-Type"] = "application/json"
        }
        
        $requestParams = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ErrorAction = "Stop"
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $jsonBody = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "Request body: $jsonBody" -ForegroundColor DarkGray
            $requestParams.Body = $jsonBody
        }
        
        Write-Host "Making $Method request to $uri" -ForegroundColor DarkGray
        Write-Host "Headers: $($Headers | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
        
        $response = Invoke-RestMethod @requestParams -StatusCodeVariable actualStatus
        
        return @{
            Success = $true
            StatusCode = $actualStatus
            Data = $response
            Error = $null
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        $errorMessage = $_.Exception.Message
        
        # Try to get more specific error info
        if ($_.Exception.Response) {
            try {
                $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $errorBody = $streamReader.ReadToEnd()
                Write-Host "Error response body: $errorBody" -ForegroundColor Red
            } catch {
                # Ignore stream reading errors
            }
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Data = $null
            Error = $errorMessage
        }
    }
}

function Get-AuthHeaders {
    if ($script:AuthToken -and $script:AuthToken -ne "") {
        Write-Host "Using token: $script:AuthToken" -ForegroundColor DarkGray
        return @{ 
            "Authorization" = "Bearer $script:AuthToken"
        }
    }
    Write-Host "No auth token available" -ForegroundColor Yellow
    return @{}
}

# --- Test Execution ---

# Initialize output file
"# AnoQ Backend API Test Results" | Out-File $OutputFile
"Generated: $(Get-Date)" | Add-Content $OutputFile
"Base URL: $BaseUrl" | Add-Content $OutputFile

Write-Host "Starting AnoQ Backend API Comprehensive Test Suite..." -ForegroundColor Yellow
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow

# Test 1: Health Check Endpoints (Public)
Write-TestHeader "1. Health Check Endpoints"
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/health"
if ($result.Success -and $result.StatusCode -eq 200) { Write-TestCase "Health Check" "PASS" "Health endpoint returns 200 OK" } 
else { Write-TestCase "Health Check" "FAIL" "Expected 200, got $($result.StatusCode)" "Health endpoint not working" }

$result = Invoke-ApiRequest -Method "GET" -Endpoint "/ready"
if ($result.Success -and $result.StatusCode -eq 200) { Write-TestCase "Ready Check" "PASS" "Ready endpoint returns 200 OK" }
else { Write-TestCase "Ready Check" "FAIL" "Expected 200, got $($result.StatusCode)" "Ready endpoint not working" }

# Test 2: Authentication Endpoints (Public)
Write-TestHeader "2. Authentication Endpoints"

# Test 2.1: Register User - Valid
$registerPayload = @{
    email = $script:RegisteredEmail
    password = $script:RegisteredPassword
    given_name = "Test"
    family_name = "User"
}
Write-Host "Attempting to register user with email: $($script:RegisteredEmail)" -ForegroundColor Gray
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/register" -Body $registerPayload
Write-Host "Register response status: $($result.StatusCode)" -ForegroundColor Gray
if ($result.Success -and $result.StatusCode -eq 201 -and $result.Data.token) {
    Write-TestCase "Register User - Valid" "PASS" "Successfully registered user and received token."
    # Don't store the registration token - we'll get a fresh one from login
    $script:CreatedUserID = $result.Data.user.id
    Write-Host "Registration successful - will get token from login" -ForegroundColor Green
} else {
    Write-TestCase "Register User - Valid" "FAIL" "Expected 201 with token, got $($result.StatusCode). Error: $($result.Error). Data: $($result.Data | ConvertTo-Json -Compress)" "User registration failed"
}

# Test 2.2: Register User - Duplicate
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/register" -Body $registerPayload
if ($result.StatusCode -eq 409) {
    Write-TestCase "Register User - Duplicate" "PASS" "Correctly returns 409 Conflict for duplicate email."
} else {
    Write-TestCase "Register User - Duplicate" "FAIL" "Expected 409, got $($result.StatusCode)" "Duplicate user registration not handled"
}

# Test 2.3: Login - Valid (GET FRESH TOKEN HERE)
$loginPayload = @{
    email = $script:RegisteredEmail
    password = $script:RegisteredPassword
}
Write-Host "Attempting to login with email: $($script:RegisteredEmail)" -ForegroundColor Gray
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/login" -Body $loginPayload
Write-Host "Login response status: $($result.StatusCode)" -ForegroundColor Gray
if ($result.Success -and $result.StatusCode -eq 200 -and $result.Data.token) {
    Write-TestCase "Login - Valid" "PASS" "Successfully logged in and received a new token."
    $script:AuthToken = $result.Data.token # Store the LOGIN token
    Write-Host "LOGIN TOKEN STORED: $($script:AuthToken)" -ForegroundColor Green
} else {
    Write-TestCase "Login - Valid" "FAIL" "Expected 200 with token, got $($result.StatusCode). Response: $($result.Data | ConvertTo-Json -Compress)" "Login failed"
}

# Test 2.4: Login - Invalid Password
$invalidLoginPayload = @{
    email = $script:RegisteredEmail
    password = "wrongpassword"
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/login" -Body $invalidLoginPayload
if ($result.StatusCode -eq 401) {
    Write-TestCase "Login - Invalid Password" "PASS" "Correctly returns 401 Unauthorized for wrong password."
} else {
    Write-TestCase "Login - Invalid Password" "FAIL" "Expected 401, got $($result.StatusCode)" "Invalid login was not rejected"
}


# Test 3: Authenticated User Operations
Write-TestHeader "3. Authenticated User Operations"

# Test 3.1: Get User - With Auth
$authHeaders = Get-AuthHeaders
Write-Host "Auth token: $($script:AuthToken)" -ForegroundColor Gray
Write-Host "Auth headers for Get User: $($authHeaders | ConvertTo-Json -Compress)" -ForegroundColor Gray
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/user" -Headers $authHeaders
Write-Host "Get User response status: $($result.StatusCode)" -ForegroundColor Gray
Write-Host "Get User response data: $($result.Data | ConvertTo-Json -Compress)" -ForegroundColor Gray
if ($result.Success -and $result.StatusCode -eq 200) {
    Write-TestCase "Get User - Valid Auth" "PASS" "Successfully fetched authenticated user."
} else {
    Write-TestCase "Get User - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode). Error: $($result.Error). Data: $($result.Data | ConvertTo-Json -Compress)" "Failed to fetch user with valid token."
}

# Test 3.2: Update User - With Auth
$updatePayload = @{
    given_name = "UpdatedName"
    family_name = "UpdatedFamily"
}
$result = Invoke-ApiRequest -Method "PUT" -Endpoint "/api/user" -Body $updatePayload -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200 -and $result.Data.user.given_name -eq "UpdatedName") {
    Write-TestCase "Update User - Valid Auth" "PASS" "Successfully updated user."
} else {
    Write-TestCase "Update User - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode)" "Failed to update user."
}


# Test 4: Authenticated Form Operations
Write-TestHeader "4. Authenticated Form Operations"

# Test 4.1: Create Form - With Auth
$formSlug = "test-form-" + $(Get-Random -Maximum 10000)
$createFormPayload = @{
    title = "My Test Form"
    description = "A form for testing purposes"
    slug = $formSlug
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/form" -Body $createFormPayload -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 201 -and $result.Data.form.slug -eq $formSlug) {
    Write-TestCase "Create Form - Valid Auth" "PASS" "Successfully created a form."
    $script:CreatedFormID = $result.Data.form.id
    $script:CreatedFormSlug = $result.Data.form.slug
} else {
    Write-TestCase "Create Form - Valid Auth" "FAIL" "Expected 201, got $($result.StatusCode)" "Form creation failed."
}

# Test 4.2: Get Form by ID (Public)
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/form/$($script:CreatedFormID)"
if ($result.Success -and $result.StatusCode -eq 200) {
    Write-TestCase "Get Form By ID - Public" "PASS" "Successfully fetched created form by ID."
} else {
    Write-TestCase "Get Form By ID - Public" "FAIL" "Expected 200, got $($result.StatusCode)" "Failed to get form by ID."
}

# Test 4.3: Update Form - With Auth
$updateFormPayload = @{ title = "My Updated Test Form" }
$result = Invoke-ApiRequest -Method "PUT" -Endpoint "/api/form/$($script:CreatedFormID)" -Body $updateFormPayload -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200 -and $result.Data.form.title -eq "My Updated Test Form") {
    Write-TestCase "Update Form - Valid Auth" "PASS" "Successfully updated the form."
} else {
    Write-TestCase "Update Form - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode)" "Form update failed."
}


# Test 5: Authenticated Question Operations
Write-TestHeader "5. Authenticated Question Operations"

# Test 5.1: Create Question - With Auth
$createQuestionPayload = @{
    question_text = "What is your favorite color?"
    type = "basic"
    position = 1
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/form/$($script:CreatedFormID)/questions" -Body $createQuestionPayload -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 201) {
    Write-TestCase "Create Question - Valid Auth" "PASS" "Successfully created a question."
    $script:CreatedQuestionIDs += $result.Data.question.id
} else {
    Write-TestCase "Create Question - Valid Auth" "FAIL" "Expected 201, got $($result.StatusCode)" "Question creation failed."
}

# Test 5.2: Get Form Questions - With Auth
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/form/$($script:CreatedFormID)/questions" -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200 -and $result.Data.questions.Count -ge 1) {
    Write-TestCase "Get Form Questions - Valid Auth" "PASS" "Successfully fetched questions for the form."
} else {
    Write-TestCase "Get Form Questions - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode)" "Fetching questions failed."
}


# Test 6: Public Response Submission
Write-TestHeader "6. Public Response Submission"

# Test 6.1: Submit Response - Valid
$submitResponsePayload = @{
    form_id = $script:CreatedFormID
    name = "Responder Joe"
    email = "responder@example.com"
    answers = @(
        @{ question_id = $script:CreatedQuestionIDs[0]; answer = "Blue" }
    )
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/response" -Body $submitResponsePayload
if ($result.Success -and $result.StatusCode -eq 201) {
    Write-TestCase "Submit Response - Valid" "PASS" "Successfully submitted a response."
    $script:CreatedResponseID = $result.Data.response_id
} else {
    Write-TestCase "Submit Response - Valid" "FAIL" "Expected 201, got $($result.StatusCode)" "Response submission failed."
}


# Test 7: Authenticated Response/Submission Viewing
Write-TestHeader "7. Authenticated Response Viewing"

# Test 7.1: Get Form Submissions - With Auth
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/form/submissions/$($script:CreatedFormSlug)" -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200 -and $result.Data.submissions.Count -ge 1) {
    Write-TestCase "Get Form Submissions - Valid Auth" "PASS" "Successfully fetched form submissions."
} else {
    Write-TestCase "Get Form Submissions - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode)" "Fetching submissions failed."
}


# Test 8: Cleanup and Logout
Write-TestHeader "8. Cleanup and Logout"

# Test 8.1: Delete Form - With Auth
$result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/form/$($script:CreatedFormID)" -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200) {
    Write-TestCase "Delete Form - Valid Auth" "PASS" "Successfully deleted the form."
} else {
    Write-TestCase "Delete Form - Valid Auth" "FAIL" "Expected 200, got $($result.StatusCode)" "Form deletion failed."
}

# Test 8.2: Logout
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/logout" -Headers $authHeaders
if ($result.Success -and $result.StatusCode -eq 200) {
    Write-TestCase "Logout" "PASS" "Successfully logged out."
    $script:AuthToken = $null
} else {
    Write-TestCase "Logout" "FAIL" "Expected 200, got $($result.StatusCode)" "Logout failed."
}

# Test 8.3: Access Protected Route After Logout
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/user" -Headers $authHeaders
if ($result.StatusCode -eq 401) {
    Write-TestCase "Access After Logout" "PASS" "Correctly denied access to protected route after logout."
} else {
    Write-TestCase "Access After Logout" "FAIL" "Expected 401, got $($result.StatusCode)" "Auth token still valid after logout."
}


# --- Final Report ---
Write-TestHeader "Test Summary and Issues Found"

$passRate = if ($script:TestCount -gt 0) { [math]::Round(($script:PassCount / $script:TestCount) * 100, 2) } else { 0 }

Add-Content $OutputFile "### Test Statistics`n"
Add-Content $OutputFile "- **Total Tests**: $($script:TestCount)"
Add-Content $OutputFile "- **Passed**: $($script:PassCount)"
Add-Content $OutputFile "- **Failed**: $($script:FailCount)"
Add-Content $OutputFile "- **Pass Rate**: $passRate%`n"

if ($script:IssuesFound.Count -gt 0) {
    Add-Content $OutputFile "### Critical Issues Found`n"
    foreach ($issue in $script:IssuesFound) {
        Add-Content $OutputFile "- $issue"
    }
} else {
    Add-Content $OutputFile "### No Critical Issues Found`n"
    Add-Content $OutputFile "All core authentication and CRUD operations appear to be working correctly."
}

Add-Content $OutputFile "`n### General Recommendations`n"
Add-Content $OutputFile "1. Continue to add tests for all validation rules and edge cases."
Add-Content $OutputFile "2. Test with different user roles and permissions once implemented."
Add-Content $OutputFile "3. Verify rate limiting with actual timing requirements."


Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "Total Tests: $($script:TestCount)" -ForegroundColor White
Write-Host "Passed: $($script:PassCount)" -ForegroundColor Green
Write-Host "Failed: $($script:FailCount)" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor White
Write-Host "Results saved to: $OutputFile" -ForegroundColor Yellow

if ($script:IssuesFound.Count -gt 0) {
    Write-Host "`nCritical Issues Found:" -ForegroundColor Red
    foreach ($issue in $script:IssuesFound) {
        Write-Host "- $issue" -ForegroundColor Red
    }
} else {
    Write-Host "`nNo critical issues found." -ForegroundColor Green
} 