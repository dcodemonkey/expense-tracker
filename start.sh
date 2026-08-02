#!/bin/bash

# 1. Auto-append default Windows Docker path to session PATH if docker isn't found
if ! command -v docker &> /dev/null; then
    DOCKER_BIN="/c/Program Files/Docker/Docker/resources/bin"
    if [ -d "$DOCKER_BIN" ]; then
        export PATH="$PATH:$DOCKER_BIN"
    fi
fi

# Re-check if Docker CLI is found
if ! command -v docker &> /dev/null; then
    echo -e "\033[0;31mError: 'docker' CLI not found.\033[0m"
    echo -e "\033[0;33mPlease verify Docker Desktop is installed.\033[0m"
    exit 1
fi

# 2. Check if Docker daemon is running, auto-start if not
if ! docker info &> /dev/null; then
    echo -e "\033[0;33mDocker daemon is not running. Attempting to start Docker Desktop...\033[0m"
    
    DOCKER_APP="/c/Program Files/Docker/Docker/Docker Desktop.exe"
    if [ -f "$DOCKER_APP" ]; then
        # Launch Docker Desktop in the background
        "$DOCKER_APP" &> /dev/null &
        
        echo -n "Waiting for Docker daemon to initialize..."
        # Poll docker info for up to 40 seconds
        for i in {1..20}; do
            sleep 2
            if docker info &> /dev/null; then
                echo -e "\n\033[0;32mDocker daemon is online!\033[0m"
                break
            fi
            echo -n "."
        done
        
        # Final check
        if ! docker info &> /dev/null; then
            echo -e "\n\033[0;31mError: Docker Desktop took too long to start. Please open it manually.\033[0m"
            exit 1
        fi
    else
        echo -e "\033[0;31mError: Docker Desktop executable not found at standard path.\033[0m"
        echo -e "Please start Docker Desktop manually."
        exit 1
    fi
fi

echo -e "\033[0;32mDocker is running. Starting Expense Tracker services...\033[0m"
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "\n\033[0;32mServices started successfully!\033[0m"
    echo -e "  - Web Dashboard: \033[0;36mhttp://localhost:3000\033[0m"
    echo -e "  - API Swagger Docs: \033[0;36mhttp://localhost:8000/docs\033[0m"
    echo -e "  - Admin Panel: \033[0;36mhttp://localhost:8501\033[0m"
else
    echo -e "\033[0;31mFailed to start services. Check the logs above.\033[0m"
fi
