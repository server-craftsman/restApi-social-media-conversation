-- Initialize SmartChat Database
-- This script runs when PostgreSQL container starts

-- Create database if not exists
SELECT 'CREATE DATABASE smartchat_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'smartchat_db')\gexec

-- Connect to the database
\c smartchat_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BUSY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_hash ON users(hash);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', email || ' ' || username || ' ' || "firstName" || ' ' || "lastName"));

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE smartchat_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log completion
SELECT 'Database initialization completed successfully' as status; 