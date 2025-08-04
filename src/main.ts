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
      .setTitle('🚀 SmartChat API')
      // .setDescription(`
      //   <div style="text-align: center; margin: 20px 0;">
      //     <h1 style="color: #2c3e50; font-size: 2.5em; margin: 0;">🎯 SmartChat</h1>
      //     <p style="color: #7f8c8d; font-size: 1.2em; margin: 10px 0;">Ứng dụng nhắn tin thời gian thực + AI trợ lý</p>
      //     <div style="display: flex; justify-content: center; gap: 10px; margin: 20px 0; flex-wrap: wrap;">
      //       <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">⚡ Real-time</span>
      //       <span style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">🤖 AI Powered</span>
      //       <span style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">🔒 Secure</span>
      //       <span style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9em;">📱 Modern</span>
      //     </div>
      //   </div>

      //   <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white;">
      //     <h3 style="margin: 0 0 15px 0; color: white;">✨ Tính năng chính</h3>
      //     <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">🔐 Authentication</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Đăng ký/Đăng nhập với JWT Token</p>
      //       </div>
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">💬 Real-time Chat</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Chat 1-1 và nhóm với WebSocket</p>
      //       </div>
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">🤖 AI ChatBot</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Tích hợp AI assistant thông minh</p>
      //       </div>
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">👥 User Management</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Quản lý người dùng và trạng thái</p>
      //       </div>
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">📚 Message History</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Lưu trữ và truy xuất tin nhắn</p>
      //       </div>
      //       <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
      //         <h4 style="margin: 0 0 8px 0; color: #f8f9fa;">🛡️ Security & Cache</h4>
      //         <p style="margin: 0; font-size: 0.9em; color: #e9ecef;">Rate Limiting & Redis Cache</p>
      //       </div>
      //     </div>
      //   </div>

      //   <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white;">
      //     <h3 style="margin: 0 0 15px 0; color: white;">🔌 WebSocket Events</h3>
      //     <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
      //       <code style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: block; font-family: 'Fira Code', monospace;">join</code>
      //       <code style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: block; font-family: 'Fira Code', monospace;">joinChat</code>
      //       <code style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: block; font-family: 'Fira Code', monospace;">sendMessage</code>
      //       <code style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: block; font-family: 'Fira Code', monospace;">typing</code>
      //       <code style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 6px; display: block; font-family: 'Fira Code', monospace;">markAsRead</code>
      //     </div>
      //   </div>

      //   <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white;">
      //     <h3 style="margin: 0 0 15px 0; color: white;">🔒 Authentication</h3>
      //     <p style="margin: 0 0 10px 0;">Tất cả API endpoints (trừ auth) yêu cầu JWT token trong header:</p>
      //     <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border-left: 4px solid #fff;">
      //       <code style="color: #f8f9fa; font-family: 'Fira Code', monospace;">Authorization: Bearer &lt;your-jwt-token&gt;</code>
      //     </div>
      //   </div>

      //   <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white;">
      //     <h3 style="margin: 0 0 15px 0; color: white;">⚡ Rate Limiting</h3>
      //     <p style="margin: 0 0 10px 0;">API được bảo vệ bởi rate limiting để chống DDOS:</p>
      //     <ul style="margin: 0; padding-left: 20px;">
      //       <li>Giới hạn: <strong>${configService.get('app.rateLimit.max')} requests</strong> per <strong>${configService.get('app.rateLimit.windowMs') / 1000 / 60} minutes</strong></li>
      //       <li>Headers: <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">X-RateLimit-*</code></li>
      //     </ul>
      //   </div>
      // `)
      .setVersion('1.0')
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
          theme: 'agate',
        },
        layout: 'BaseLayout',
        deepLinking: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        defaultModelRendering: 'example',
        displayRequestDuration: true,
        docExpansion: 'list',
        maxDisplayedTags: 10,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'SmartChat API Documentation',
      customCss: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        
        :root {
          --primary-color: #DA020E;
          --secondary-color: #B8101D;
          --accent-color: #FFD700;
          --success-color: #FFD700;
          --warning-color: #DA020E;
          --info-color: #FFD700;
          --vietnam-red: #DA020E;
          --vietnam-yellow: #FFD700;
        }
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        code, pre, .microlight {
          font-family: 'Fira Code', 'SF Mono', Monaco, Consolas, monospace !important;
        }
        
        body {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 100%) !important;
          margin: 0 !important;
          min-height: 100vh !important;
        }
        
        .swagger-ui {
          background: transparent !important;
        }
        
        .swagger-ui .topbar {
          display: none !important;
        }
        
        .swagger-ui .wrapper {
          max-width: 1400px !important;
          margin: 0 auto !important;
          padding: 20px !important;
        }
        
        .swagger-ui .info {
          background: rgba(255, 215, 0, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 20px !important;
          padding: 40px !important;
          margin-bottom: 30px !important;
          box-shadow: 0 20px 40px rgba(218, 2, 14, 0.3) !important;
          border: 2px solid #DA020E !important;
        }
        
        .swagger-ui .info .title {
          color: #DA020E !important;
          font-size: 3em !important;
          font-weight: 700 !important;
          margin-bottom: 20px !important;
          text-align: center !important;
          text-shadow: 2px 2px 4px rgba(218, 2, 14, 0.3) !important;
        }
        
        .swagger-ui .info .description {
          font-size: 1em !important;
          line-height: 1.6 !important;
          color: #DA020E !important;
          font-weight: 500 !important;
        }
        
        .swagger-ui .scheme-container {
          background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%) !important;
          padding: 20px !important;
          border-radius: 15px !important;
          border: 2px solid #DA020E !important;
          box-shadow: 0 5px 15px rgba(218, 2, 14, 0.3) !important;
        }
        
        .swagger-ui .opblock-tag {
          background: rgba(255, 215, 0, 0.9) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 15px !important;
          margin-bottom: 20px !important;
          border: 2px solid #DA020E !important;
          box-shadow: 0 10px 30px rgba(218, 2, 14, 0.2) !important;
          overflow: hidden !important;
        }
        
        .swagger-ui .opblock-tag-section h3 {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 100%) !important;
          color: #FFD700 !important;
          padding: 20px 30px !important;
          margin: 0 !important;
          font-size: 1.3em !important;
          font-weight: 600 !important;
          border: none !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
        }
        
        .swagger-ui .opblock {
          border-radius: 12px !important;
          margin: 15px 0 !important;
          box-shadow: 0 5px 15px rgba(218, 2, 14, 0.2) !important;
          border: 1px solid #DA020E !important;
          overflow: hidden !important;
        }
        
        .swagger-ui .opblock.opblock-get {
          background: linear-gradient(135deg, #FFD700 0%, #FFC700 20%, rgba(255, 215, 0, 0.1) 100%) !important;
        }
        
        .swagger-ui .opblock.opblock-post {
          background: linear-gradient(135deg, #FFD700 0%, #FFC700 20%, rgba(255, 215, 0, 0.1) 100%) !important;
        }
        
        .swagger-ui .opblock.opblock-put {
          background: linear-gradient(135deg, #FFD700 0%, #FFC700 20%, rgba(255, 215, 0, 0.1) 100%) !important;
        }
        
        .swagger-ui .opblock.opblock-delete {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 20%, rgba(218, 2, 14, 0.1) 100%) !important;
        }
        
        .swagger-ui .opblock .opblock-summary {
          padding: 15px 20px !important;
          font-weight: 500 !important;
          color: #DA020E !important;
        }
        
        .swagger-ui .btn {
          border-radius: 8px !important;
          font-weight: 500 !important;
          padding: 8px 16px !important;
          transition: all 0.3s ease !important;
        }
        
        .swagger-ui .btn.authorize {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 100%) !important;
          border: none !important;
          color: #FFD700 !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
        }
        
        .swagger-ui .btn.execute {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 100%) !important;
          border: none !important;
          color: #FFD700 !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
        }
        
        .swagger-ui .btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 5px 15px rgba(218, 2, 14, 0.4) !important;
        }
        
        .swagger-ui .parameters-container {
          background: rgba(255, 215, 0, 0.3) !important;
          border-radius: 10px !important;
          padding: 20px !important;
          border: 1px solid #DA020E !important;
        }
        
        .swagger-ui .responses-wrapper {
          background: rgba(255, 215, 0, 0.3) !important;
          border-radius: 10px !important;
          padding: 20px !important;
          border: 1px solid #DA020E !important;
        }
        
        .swagger-ui .model-box {
          background: rgba(255, 215, 0, 0.8) !important;
          border-radius: 10px !important;
          padding: 15px !important;
          border: 1px solid #DA020E !important;
        }
        
        .swagger-ui .response-content-type {
          border-radius: 8px !important;
          background: #FFD700 !important;
          color: #DA020E !important;
        }
        
        .swagger-ui .highlight-code {
          border-radius: 8px !important;
          background: #DA020E !important;
          color: #FFD700 !important;
        }
        
        .swagger-ui .curl-command {
          background: #DA020E !important;
          color: #FFD700 !important;
          border-radius: 8px !important;
          padding: 15px !important;
          border: 1px solid #FFD700 !important;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px !important;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 215, 0, 0.3) !important;
          border-radius: 4px !important;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #DA020E 0%, #B8101D 100%) !important;
          border-radius: 4px !important;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #B8101D 0%, #A00F1B 100%) !important;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .swagger-ui .wrapper {
            padding: 10px !important;
          }
          
          .swagger-ui .info {
            padding: 20px !important;
          }
          
          .swagger-ui .info .title {
            font-size: 2em !important;
          }
        }
        
        /* Animation */
        .swagger-ui .opblock-tag-section {
          animation: slideInUp 0.5s ease-out !important;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Custom badge styles */
        .swagger-ui .info .description span[style*="background"] {
          display: inline-block !important;
          margin: 5px !important;
          font-weight: 500 !important;
          background: #DA020E !important;
          color: #FFD700 !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
          box-shadow: 0 2px 8px rgba(218, 2, 14, 0.3) !important;
          transition: all 0.3s ease !important;
          border: 1px solid #FFD700 !important;
        }
        
        .swagger-ui .info .description span[style*="background"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(218, 2, 14, 0.4) !important;
        }
        
        /* Status codes styling */
        .swagger-ui .response-col_status {
          color: #DA020E !important;
          font-weight: bold !important;
        }
        
        /* Method badges */
        .swagger-ui .opblock-summary-method {
          background: #DA020E !important;
          color: #FFD700 !important;
          border: 1px solid #FFD700 !important;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Authorization modal */
        .swagger-ui .modal-ux {
          background: rgba(218, 2, 14, 0.9) !important;
        }
        
        .swagger-ui .modal-ux-content {
          background: #FFD700 !important;
          border: 2px solid #DA020E !important;
          color: #DA020E !important;
        }
        
        /* Input fields */
        .swagger-ui input[type="text"], 
        .swagger-ui input[type="password"], 
        .swagger-ui textarea {
          background: #FFD700 !important;
          border: 1px solid #DA020E !important;
          color: #DA020E !important;
        }
        
        .swagger-ui input[type="text"]:focus, 
        .swagger-ui input[type="password"]:focus, 
        .swagger-ui textarea:focus {
          border-color: #DA020E !important;
          box-shadow: 0 0 0 2px rgba(218, 2, 14, 0.2) !important;
        }
      `,
    });

    const port = configService.get('app.port') || 51213;
    const host = configService.get('app.host') || '0.0.0.0';

    await app.listen(port, host);
    console.log('\x1b[93m🌟 SMARTCHAT API SERVER 🌟\x1b[0m');
    console.log('='.repeat(70));
    console.log(`\x1b[92m📡 Server Status    :\x1b[0m ONLINE & READY`);
    console.log(`\x1b[94m🔗 API Endpoint     :\x1b[0m http://${host}:${port}`);
    console.log(`\x1b[96m📖 Documentation   :\x1b[0m http://${host}:${port}/ambatukam`);
    console.log(`\x1b[95m🎯 API v1 Endpoints :\x1b[0m http://${host}:${port}/api/v1`);
    console.log(`\x1b[93m⚡ Environment     :\x1b[0m ${configService.get('app.environment') || 'development'}`);
    console.log(`\x1b[91m🔒 Rate Limiting   :\x1b[0m ${configService.get('app.rateLimit.max')} req/${configService.get('app.rateLimit.windowMs') / 1000 / 60}min`);
    console.log(`\x1b[96m💾 Redis Cache     :\x1b[0m ${configService.get('app.redis.host')}:${configService.get('app.redis.port')}`);
    console.log(`\x1b[90m🕒 Started at      :\x1b[0m ${new Date().toLocaleString()}`);
    console.log('='.repeat(70));
    console.log('\x1b[92m✨ Ready to serve intelligent conversations ✨\x1b[0m\n');
  } catch (error) {
    console.error('Failed to start application:', error);
    throw error;
  }
}
bootstrap();
