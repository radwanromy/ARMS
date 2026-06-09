# deploy.ps1 - Deploy ARMS locally in containers

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting local deployment of ARMS via Docker     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Stop existing services
docker-compose down

# Build and start services
docker-compose up -d --build

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Services are launching in background!            " -ForegroundColor Green
Write-Host " Access endpoints:                                " -ForegroundColor Green
Write-Host "   - Frontend Web App:  http://localhost:4200      " -ForegroundColor Green
Write-Host "   - Backend API Docs:  http://localhost:8080/swagger-ui/index.html" -ForegroundColor Green
Write-Host "   - Actuator Health:   http://localhost:8080/actuator/health" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
