# 1. Auto-append default Windows Docker path to session PATH if docker isn't found
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    $dockerBin = "C:\Program Files\Docker\Docker\resources\bin"
    if (Test-Path $dockerBin) {
        $env:PATH += ";$dockerBin"
    }
}

# Re-check if Docker CLI is found
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'docker' command not found." -ForegroundColor Red
    Write-Host "Please make sure Docker Desktop is installed." -ForegroundColor Yellow
    Exit 1
}

# 2. Check if Docker daemon is running, auto-start if not
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker daemon is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
    $dockerApp = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerApp) {
        Start-Process $dockerApp
        
        Write-Host -NoNewline "Waiting for Docker daemon to initialize..."
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Seconds 2
            docker info > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`nDocker daemon is online!" -ForegroundColor Green
                break
            }
            Write-Host -NoNewline "."
        }
        
        # Final check
        docker info > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nError: Docker Desktop took too long to start. Please open it manually." -ForegroundColor Red
            Exit 1
        }
    } else {
        Write-Host "Error: Docker Desktop executable not found at standard path." -ForegroundColor Red
        Write-Host "Please start Docker Desktop manually." -ForegroundColor Yellow
        Exit 1
    }
}

Write-Host "Docker is running. Starting Expense Tracker services..." -ForegroundColor Green
docker compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nServices started successfully!" -ForegroundColor Green
    Write-Host "  - Web Dashboard: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  - API Swagger Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  - Admin Panel: http://localhost:8501" -ForegroundColor Cyan
} else {
    Write-Host "Failed to start services. Check the logs above." -ForegroundColor Red
}
