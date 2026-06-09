#!/bin/bash
# deploy.sh - Deploy ARMS locally in containers

echo "=================================================="
echo " Starting local deployment of ARMS via Docker     "
echo "=================================================="

# Down existing services
docker-compose down

# Build and start services
docker-compose up -d --build

echo "=================================================="
echo " Services are launching in background!            "
echo " Access endpoints:                                "
echo "   - Frontend Web App:  http://localhost:4200      "
echo "   - Backend API Docs:  http://localhost:8080/swagger-ui/index.html"
echo "   - Actuator Health:   http://localhost:8080/actuator/health"
echo "=================================================="
