import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  // Debug CORS configuration
  console.log('🔍 Environment ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];
  console.log('🔍 Parsed allowedOrigins:', allowedOrigins);

  return {
    // App Configuration
    name: process.env.APP_NAME || 'SmartChat API',
    description: process.env.APP_DESCRIPTION || 'Real-time chat application with AI assistant',
    version: process.env.APP_VERSION || '1.0.0',
    prefix: process.env.APP_PREFIX || 'api',
    port: parseInt(process.env.PORT || '51213', 10) || 51213,
    host: process.env.APP_HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.APP_DEBUG === 'true',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.APP_FRONTEND_DOMAIN || process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
    allowedOrigins: allowedOrigins,

    // Database Configuration
    database: {
      type: process.env.DATABASE_TYPE || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10) || 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || '19102003',
      name: process.env.DATABASE_NAME || 'smartchat_db',
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100', 10) || 100,
      ssl: {
        enabled: process.env.DATABASE_SSL_ENABLED === 'true',
        rejectUnauthorized: process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
        ca: process.env.DATABASE_CA || '',
        key: process.env.DATABASE_KEY || '',
        cert: process.env.DATABASE_CERT || '',
      },
      url: process.env.DATABASE_URL || `postgresql://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || '19102003'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'smartchat_db'}`,
    },

    // Redis Configuration for Caching and Rate Limiting
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'smartchat:',
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY_ON_FAILOVER || '100', 10) || 100,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10) || 3,
      enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
      maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru',
      maxMemory: process.env.REDIS_MAX_MEMORY || '256mb',
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    },

    // Authentication Configuration
    auth: {
      jwt: {
        secret: process.env.AUTH_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.AUTH_JWT_TOKEN_EXPIRES_IN || '15m',
        refreshSecret: process.env.AUTH_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
        refreshExpiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '3650d',
        forgotSecret: process.env.AUTH_FORGOT_SECRET || 'your-super-secret-forgot-key-change-in-production',
        forgotExpiresIn: process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN || '30m',
        confirmEmailSecret: process.env.AUTH_CONFIRM_EMAIL_SECRET || 'your-super-secret-confirm-email-key-change-in-production',
        confirmEmailExpiresIn: process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN || '1d',
      },
      bcrypt: {
        saltRounds: parseInt(process.env.AUTH_BCRYPT_SALT_ROUNDS || '12', 10) || 12,
      },
    },

    // Rate Limiting Configuration
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) || 100, // limit each IP to 100 requests per windowMs
      message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.',
      standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== 'false',
      legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS !== 'false',
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS !== 'false',
    },

    // Security Configuration
    security: {
      cors: {
        enabled: process.env.CORS_ENABLED !== 'false',
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS !== 'false',
      },
      helmet: {
        enabled: process.env.HELMET_ENABLED !== 'false',
        contentSecurityPolicy: process.env.HELMET_CONTENT_SECURITY_POLICY !== 'false',
        crossOriginEmbedderPolicy: process.env.HELMET_CROSS_ORIGIN_EMBEDDER_POLICY !== 'false',
      },
      csrf: {
        enabled: process.env.CSRF_ENABLED === 'true',
        cookie: process.env.CSRF_COOKIE === 'true',
      },
    },

    // Mail Configuration
    mail: {
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587', 10) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      user: process.env.MAIL_USER || 'your-email@gmail.com',
      password: process.env.MAIL_PASSWORD || 'your-app-password',
      defaultEmail: process.env.MAIL_DEFAULT_EMAIL || 'noreply@smartchat.com',
      defaultName: process.env.MAIL_DEFAULT_NAME || 'SmartChat',
      ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
      requireTLS: process.env.MAIL_REQUIRE_TLS !== 'false',
    },

    // Logging Configuration
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'combined',
      enableRequestLogging: process.env.LOG_ENABLE_REQUEST_LOGGING !== 'false',
      enableErrorLogging: process.env.LOG_ENABLE_ERROR_LOGGING !== 'false',
    },

    // Cache Configuration
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || '300', 10) || 300, // 5 minutes
      max: parseInt(process.env.CACHE_MAX || '100', 10) || 100,
      checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10) || 600,
    },

    // WebSocket Configuration
    websocket: {
      cors: {
        origin: process.env.WS_CORS_ORIGIN || '*',
        credentials: process.env.WS_CORS_CREDENTIALS !== 'false',
      },
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000', 10) || 60000,
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10) || 25000,
    },
  };
});
