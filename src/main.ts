import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
const compression = require('compression');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global prefix
    const prefix = configService.get('app.prefix');
    if (prefix) {
      app.setGlobalPrefix(prefix);
    }

    // Enable API versioning
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    });

    // Security middleware
    const helmetEnabled = configService.get('app.security.helmet.enabled');
    if (helmetEnabled !== false) {
      app.use(helmet());
    }

    // Compression
    app.use(compression());

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: configService.get('app.environment') === 'production',
    }));

    // Global API response interceptor
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    // CORS configuration
    const allowedOrigins = configService.get('app.allowedOrigins') || [];
    const corsEnabled = configService.get('app.security.cors.enabled');
    const environment = configService.get('app.environment');

    console.log('CORS Configuration:', {
      enabled: corsEnabled,
      environment: environment,
      allowedOrigins: allowedOrigins,
    });

    if (corsEnabled !== false) {
      // In development, allow all origins for easier testing
      if (environment === 'development') {
        app.enableCors({
          origin: true, // Allow all origins in development
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
          exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        });
        console.log('🔓 CORS: Development mode - allowing all origins');
      } else {
        // In production, use strict origin checking
        app.enableCors({
          origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
              console.log('CORS: No origin - allowing');
              return callback(null, true);
            }

            console.log('CORS: Checking origin:', origin);

            // Check if origin is in allowed list
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
              console.log('CORS: Origin allowed:', origin);
              return callback(null, true);
            } else {
              console.log('CORS: Origin rejected:', origin);
              console.log('CORS: Allowed origins:', allowedOrigins);
              return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
            }
          },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
          exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        });
        console.log('🔒 CORS: Production mode - using origin whitelist');
      }
    }

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('SmartChat API')
      .setDescription(`
        ## 🎯 SmartChat - Ứng dụng nhắn tin thời gian thực + AI trợ lý

        ### Tính năng chính:
        - **Authentication**: Đăng ký/Đăng nhập với JWT Token
        - **Real-time Chat**: Chat 1-1 và nhóm với WebSocket
        - **AI ChatBot**: Tích hợp AI assistant
        - **User Management**: Quản lý người dùng và trạng thái
        - **Message History**: Lưu trữ và truy xuất tin nhắn
        - **Rate Limiting**: Bảo vệ API khỏi DDOS
        - **Caching**: Tối ưu performance với Redis

        ### WebSocket Events:
        - \`join\`: User tham gia hệ thống
        - \`joinChat\`: Tham gia chat room
        - \`sendMessage\`: Gửi tin nhắn real-time
        - \`typing\`: Typing indicator
        - \`markAsRead\`: Đánh dấu tin nhắn đã đọc

        ### Authentication:
        Tất cả API endpoints (trừ auth) yêu cầu JWT token trong header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`

        ### Rate Limiting:
        API được bảo vệ bởi rate limiting để chống DDOS:
        - Giới hạn: ${configService.get('app.rateLimit.max')} requests per ${configService.get('app.rateLimit.windowMs') / 1000 / 60} minutes
        - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
      `)
      .setVersion('1.0')
      .addTag('Authentication', 'Đăng ký, đăng nhập và quản lý token')
      .addTag('Users', 'Quản lý thông tin người dùng')
      .addTag('Chats', 'Quản lý chat và tin nhắn')
      .addTag('AI Chat', 'Tương tác với AI assistant')
      .addTag('WebSocket', 'Real-time communication events')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addSecurityRequirements('JWT-auth')
      .addServer('http://localhost:51213', 'Development server')
      .addServer('https://api.smartchat.com', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('ambatukam', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
      },
      customSiteTitle: 'SmartChat API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
        .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
      `,
    });

    const port = configService.get('app.port') || 51213;
    const host = configService.get('app.host') || '0.0.0.0';

    await app.listen(port, host);

    console.log('\n' + '='.repeat(70));
    console.log('🌟 SMARTCHAT API SERVER 🌟');
    console.log('='.repeat(70));
    console.log(`📡 Server Status    : ONLINE & READY`);
    console.log(`🔗 API Endpoint     : http://${host}:${port}`);
    console.log(`📖 Documentation   : http://${host}:${port}/ambatukam`);
    console.log(`🎯 API v1 Endpoints : http://${host}:${port}/api/v1`);
    console.log(`⚡ Environment     : ${configService.get('app.environment') || 'development'}`);
    console.log(`🔒 Rate Limiting   : ${configService.get('app.rateLimit.max')} req/${configService.get('app.rateLimit.windowMs') / 1000 / 60}min`);
    console.log(`💾 Redis Cache     : ${configService.get('app.redis.host')}:${configService.get('app.redis.port')}`);
    console.log(`🕒 Started at      : ${new Date().toLocaleString()}`);
    console.log('='.repeat(70));
    console.log('✨ Ready to serve intelligent conversations ✨\n');
  } catch (error) {
    console.error('Failed to start application:', error);
    throw error;
  }
}
bootstrap();
