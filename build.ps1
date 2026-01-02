# Build script for Download Router Firefox Extension
# Creates a zip file ready for Firefox AMO submission

$ErrorActionPreference = "Stop"

# Paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = Join-Path $scriptDir "src"
$buildDir = Join-Path $scriptDir "build"
$outputFile = Join-Path $buildDir "download-router.zip"

# Create build directory if it doesn't exist
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
    Write-Host "Created build directory: $buildDir"
}

# Remove existing zip if present
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
    Write-Host "Removed existing: $outputFile"
}

# Run 7-Zip from src directory
$7zPath = "7z"  # Assumes 7z is in PATH, adjust if needed

Write-Host "Creating zip archive from src/..."
& $7zPath a -tzip $outputFile "$srcDir\*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Created: $outputFile" -ForegroundColor Green
}
else {
    Write-Host "`nError creating zip file" -ForegroundColor Red
    exit 1
}
