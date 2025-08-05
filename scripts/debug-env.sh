#!/bin/bash

echo "🔍 Environment Variables Debug"
echo "================================"

echo "Node Environment:"
echo "NODE_ENV: ${NODE_ENV:-'Not set'}"
echo "PORT: ${PORT:-'Not set'}"

echo ""
echo "Database Configuration:"
echo "DATABASE_URL: ${DATABASE_URL:-'Not set'}"
echo "DATABASE_HOST: ${DATABASE_HOST:-'Not set'}"
echo "DATABASE_PORT: ${DATABASE_PORT:-'Not set'}"
echo "DATABASE_USERNAME: ${DATABASE_USERNAME:-'Not set'}"
echo "DATABASE_PASSWORD: ${DATABASE_PASSWORD:+'Set'}"
echo "DATABASE_NAME: ${DATABASE_NAME:-'Not set'}"

echo ""
echo "Redis Configuration:"
echo "REDIS_HOST: ${REDIS_HOST:-'Not set'}"
echo "REDIS_PORT: ${REDIS_PORT:-'Not set'}"
echo "REDIS_PASSWORD: ${REDIS_PASSWORD:+'Set'}"

echo ""
echo "Auth Configuration:"
echo "AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:+'Set'}"
echo "AUTH_REFRESH_SECRET: ${AUTH_REFRESH_SECRET:+'Set'}"

echo ""
echo "Mail Configuration:"
echo "MAIL_HOST: ${MAIL_HOST:-'Not set'}"
echo "MAIL_USER: ${MAIL_USER:-'Not set'}"
echo "MAIL_PASSWORD: ${MAIL_PASSWORD:+'Set'}"

echo ""
echo "Other:"
echo "ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-'Not set'}"
echo "APP_HOST: ${APP_HOST:-'Not set'}" 