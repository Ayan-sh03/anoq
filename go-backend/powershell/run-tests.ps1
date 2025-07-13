# AnoQ Backend Test Runner
# Starts the server, runs comprehensive tests, and generates reports

param(
    [string]$ServerPort = "8080",
    [string]$TestOutputDir = "test-results",
    [switch]$StartServer = $false,
    [switch]$StopServerAfter = $false
)

$ErrorActionPreference = "Continue"

# Configuration
$BaseUrl = "http://localhost:$ServerPort"
$ServerExe = ".\bin\anoq-backend.exe"
$TestScript = ".\powershell\comprehensive-api-test.ps1"

# Create output directory
if (-not (Test-Path $TestOutputDir)) {
    New-Item -ItemType Directory -Path $TestOutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = "$TestOutputDir\test-results-$timestamp.md"

Write-Host "AnoQ Backend Test Runner" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Server URL: $BaseUrl" -ForegroundColor White
Write-Host "Output File: $outputFile" -ForegroundColor White
Write-Host ""

# Function to check if server is running
function Test-ServerRunning {
    param([string]$Url)
    try {
        $response = Invoke-RestMethod -Uri "$Url/health" -Method GET -TimeoutSec 5
        return $true
    } catch {
        return $false
    }
}

# Function to start server
function Start-TestServer {
    Write-Host "Starting AnoQ Backend Server..." -ForegroundColor Yellow
    
    if (-not (Test-Path $ServerExe)) {
        Write-Host "Building server..." -ForegroundColor Yellow
        go build -o $ServerExe .\cmd\server
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to build server" -ForegroundColor Red
            exit 1
        }
    }
    
    # Start server in background
    $serverProcess = Start-Process -FilePath $ServerExe -WindowStyle Hidden -PassThru
    Write-Host "Server started with PID: $($serverProcess.Id)" -ForegroundColor Green
    
    # Wait for server to be ready
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        if (Test-ServerRunning -Url $BaseUrl) {
            Write-Host "Server is ready!" -ForegroundColor Green
            return $serverProcess
        }
        Start-Sleep -Seconds 1
        $waited++
        Write-Host "Waiting for server... ($waited/$maxWait)" -ForegroundColor Gray
    }
    
    Write-Host "Server failed to start within $maxWait seconds" -ForegroundColor Red
    if ($serverProcess -and -not $serverProcess.HasExited) {
        $serverProcess.Kill()
    }
    exit 1
}

# Function to stop server
function Stop-TestServer {
    param($Process)
    if ($Process -and -not $Process.HasExited) {
        Write-Host "Stopping server..." -ForegroundColor Yellow
        $Process.Kill()
        $Process.WaitForExit(10000)
        Write-Host "Server stopped" -ForegroundColor Green
    }
}

# Main execution
$serverProcess = $null

try {
    # Check if server should be started
    if ($StartServer) {
        $serverProcess = Start-TestServer
    } else {
        # Check if server is already running
        if (-not (Test-ServerRunning -Url $BaseUrl)) {
            Write-Host "Server is not running at $BaseUrl" -ForegroundColor Red
            Write-Host "Either start the server manually or use -StartServer flag" -ForegroundColor Yellow
            exit 1
        } else {
            Write-Host "Using existing server at $BaseUrl" -ForegroundColor Green
        }
    }
    
    # Run comprehensive tests
    Write-Host "`nRunning comprehensive API tests..." -ForegroundColor Yellow
    Write-Host "This may take several minutes..." -ForegroundColor Gray
    Write-Host ""
    
    if (Test-Path $TestScript) {
        & $TestScript -BaseUrl $BaseUrl -OutputFile $outputFile
    } else {
        Write-Host "Test script not found: $TestScript" -ForegroundColor Red
        exit 1
    }
    
    # Show summary
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "Test Execution Complete!" -ForegroundColor Green
    Write-Host "Results saved to: $outputFile" -ForegroundColor White
    
    if (Test-Path $outputFile) {
        Write-Host "`nOpening results file..." -ForegroundColor Yellow
        try {
            Start-Process $outputFile
        } catch {
            Write-Host "Could not open results file automatically" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Error during test execution: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up server if we started it
    if ($StopServerAfter -and $serverProcess) {
        Stop-TestServer -Process $serverProcess
    }
}

Write-Host "`nTest run completed. Check the results file for detailed findings." -ForegroundColor Green
Write-Host "Issues document: .\ISSUES_AND_FIXES.md" -ForegroundColor Yellow 