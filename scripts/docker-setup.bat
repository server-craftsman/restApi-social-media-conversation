@echo off
echo ==========================================
echo 🐳 SmartChat Docker Setup (Windows)
echo ==========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please install Docker Compose first.
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Stop any running containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Remove old volumes (optional)
set /p CLEAN_VOLUMES="Do you want to clean old volumes? (y/N): "
if /i "%CLEAN_VOLUMES%"=="y" (
    echo 🧹 Cleaning old volumes...
    docker-compose down -v
)

REM Build and start development environment
echo 🏗️ Building and starting development environment...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 📊 Checking service status...
docker-compose ps

REM Run database migrations
echo 🗄️ Running database migrations...
docker-compose exec api pnpm prisma generate
docker-compose exec api pnpm prisma db push

echo ==========================================
echo ✅ Docker setup completed successfully!
echo ==========================================
echo.
echo 🌐 API Server: http://localhost:51213
echo 📚 API Documentation: http://localhost:51213/ambatukam
echo 🗄️ PostgreSQL: localhost:5432
echo 🔴 Redis: localhost:6379
echo 📊 pgAdmin: http://localhost:8080 (admin@smartchat.com / admin123)
echo 🔍 Redis Commander: http://localhost:8081
echo.
echo 📋 Useful commands:
echo   docker-compose logs -f api     # View API logs
echo   docker-compose logs -f postgres # View database logs
echo   docker-compose logs -f redis   # View Redis logs
echo   docker-compose down            # Stop all services
echo   docker-compose restart api     # Restart API only
echo.
echo 🚀 To start production environment:
echo   pnpm run docker:prod
echo. 