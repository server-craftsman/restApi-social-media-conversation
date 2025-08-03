# SmartChat - Ứng dụng nhắn tin thời gian thực + AI trợ lý

## 🎯 Tính năng chính

- **Đăng ký / Đăng nhập người dùng** (JWT Token)
- **Chat real-time 1-1 hoặc nhóm nhỏ** (Socket.IO/WebSocket)
- **Lưu trữ lịch sử chat** (PostgreSQL với Prisma)
- **Tích hợp AI ChatBot**:
  - Chat riêng với chatbot như ChatGPT mini
  - Gợi ý tự động trả lời, tóm tắt tin nhắn
  - Kiểm tra chính tả, gợi ý phản hồi
- **Typing Indicator**, tin nhắn đã xem, ai đang online
- **Tối ưu cho desktop/mobile**

## 📁 Cấu trúc dự án

```
smartchat/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── auth.module.ts
│   ├── user/                # User management module
│   │   ├── dto/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   ├── chat/                # Chat functionality module
│   │   ├── dto/
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.gateway.ts  # WebSocket gateway
│   │   └── chat.module.ts
│   ├── ai-chat/             # AI chat module
│   │   ├── dto/
│   │   ├── ai-chat.controller.ts
│   │   ├── ai-chat.service.ts
│   │   └── ai-chat.module.ts
│   ├── prisma/              # Database module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/              # Shared components
│   │   └── dto/
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Database seeding
│   └── migrations/          # Database migrations
├── scripts/                 # Automation scripts
│   ├── setup-db.sh         # Full database setup
│   ├── setup-simple.sh     # Simple database setup
│   ├── migrate-dev.sh      # Development migrations
│   └── migrate-prod.sh     # Production migrations
├── docker-compose.dev.yml   # Docker development setup
├── Dockerfile.dev          # Docker development image
├── .env                    # Development environment
├── .env.production         # Production environment
└── package.json
```

## 🚀 Cài đặt và chạy

### 1. Yêu cầu hệ thống

- **Node.js** (v18 hoặc cao hơn)
- **pnpm** (hoặc npm/yarn)
- **PostgreSQL** (v13 hoặc cao hơn)
- **Docker** (tùy chọn, cho development)

### 2. Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd smartchat

# Cài đặt dependencies
pnpm install
```

### 3. Cấu hình môi trường

#### Tạo file .env
```bash
# Development Environment
NODE_ENV=development
PORT=51213

# Database URLs
DATABASE_URL="postgresql://postgres:19102003@localhost:5432/smartchat_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartchat_db
DB_USER=postgres
DB_PASSWORD=19102003

# Logging
LOG_LEVEL=debug
```

#### Tạo file .env.production
```bash
# Production Environment Configuration
NODE_ENV=production
PORT=51213

# Production Database URL
DATABASE_URL="postgresql://username:password@host:5432/database"

# JWT Configuration
JWT_SECRET="your-production-jwt-secret-key-change-this"

# Database Configuration
DB_HOST=your-production-host
DB_PORT=5432
DB_NAME=your-production-database
DB_USER=your-production-user
DB_PASSWORD=your-production-password

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Cài đặt và cấu hình PostgreSQL

#### Option A: Docker (Khuyến nghị)

```bash
# Cài đặt Docker Desktop
# Tải từ: https://www.docker.com/products/docker-desktop/

# Khởi động PostgreSQL với Docker
docker-compose -f docker-compose.dev.yml up -d postgres

# Kiểm tra container
docker ps
```

#### Option B: PostgreSQL Local

1. **Cài đặt PostgreSQL:**
   - Windows: Tải từ https://www.postgresql.org/download/windows/
   - Hoặc dùng: `winget install PostgreSQL.PostgreSQL`

2. **Khởi động service:**
   ```cmd
   # Qua Services
   services.msc -> postgresql-x64-16 -> Start
   
   # Hoặc qua Command Prompt (Admin)
   net start postgresql-x64-16
   ```

3. **Tạo database:**
   ```cmd
   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
   CREATE DATABASE smartchat_db;
   CREATE USER smartchat_user WITH PASSWORD '19102003';
   GRANT ALL PRIVILEGES ON DATABASE smartchat_db TO smartchat_user;
   ```

### 5. Setup Database

#### Option A: Setup đơn giản (Khuyến nghị)
```bash
pnpm setup:simple
```

#### Option B: Setup thủ công
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed database with sample data
pnpm db:seed
```

#### Option C: Setup đầy đủ (với kiểm tra PostgreSQL)
```bash
pnpm setup:db
```

### 6. Chạy ứng dụng

```bash
# Development mode với auto-restart
pnpm start:dev

# Production mode
pnpm start:prod

# Debug mode
pnpm start:debug
```

## 📡 API Documentation

### Swagger UI
Sau khi chạy ứng dụng, truy cập: **http://localhost:51213/api**

### Authentication Endpoints

#### Đăng ký người dùng
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "password123",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Đăng nhập
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Đăng xuất
```http
POST /auth/logout
Authorization: Bearer <jwt-token>
```

### User Endpoints

#### Lấy danh sách users
```http
GET /users
Authorization: Bearer <jwt-token>
```

#### Lấy thông tin user
```http
GET /users/:id
Authorization: Bearer <jwt-token>
```

#### Cập nhật user
```http
PATCH /users/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "username": "new_username",
  "email": "newemail@example.com",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

### Chat Endpoints

#### Tạo chat mới
```http
POST /chats
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Nhóm bạn thân",
  "memberIds": ["user1_id", "user2_id"]
}
```

#### Lấy danh sách chat
```http
GET /chats
Authorization: Bearer <jwt-token>
```

#### Lấy tin nhắn của chat
```http
GET /chats/:id/messages
Authorization: Bearer <jwt-token>
```

#### Gửi tin nhắn
```http
POST /chats/:id/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Xin chào! Bạn khỏe không?",
  "type": "TEXT"
}
```

### AI Chat Endpoints

#### Tạo AI chat mới
```http
POST /ai-chats
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Hỗ trợ kỹ thuật"
}
```

#### Lấy danh sách AI chat
```http
GET /ai-chats
Authorization: Bearer <jwt-token>
```

#### Gửi tin nhắn cho AI
```http
POST /ai-chats/:id/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Bạn có thể giúp tôi giải thích về machine learning không?"
}
```

## 🔌 WebSocket Events

### Kết nối WebSocket
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:51213');
```

### Client → Server Events

#### Join user vào hệ thống
```javascript
socket.emit('join', { userId: 'user-id' });
```

#### Tham gia chat room
```javascript
socket.emit('joinChat', { chatId: 'chat-id' });
```

#### Gửi tin nhắn
```javascript
socket.emit('sendMessage', {
  chatId: 'chat-id',
  userId: 'user-id',
  message: {
    content: 'Hello!',
    type: 'TEXT'
  }
});
```

#### Typing indicator
```javascript
// Bắt đầu typing
socket.emit('typing', { chatId: 'chat-id', userId: 'user-id' });

// Dừng typing
socket.emit('stopTyping', { chatId: 'chat-id', userId: 'user-id' });
```

#### Đánh dấu tin nhắn đã đọc
```javascript
socket.emit('markAsRead', {
  chatId: 'chat-id',
  messageId: 'message-id',
  userId: 'user-id'
});
```

### Server → Client Events

#### Lắng nghe tin nhắn mới
```javascript
socket.on('newMessage', (data) => {
  console.log('Tin nhắn mới:', data);
  // data: { message, chatId, senderId }
});
```

#### Lắng nghe typing indicator
```javascript
socket.on('typing', (data) => {
  console.log('User đang typing:', data);
  // data: { userId, chatId }
});

socket.on('typingStop', (data) => {
  console.log('User dừng typing:', data);
});
```

#### Lắng nghe tin nhắn đã đọc
```javascript
socket.on('messageRead', (data) => {
  console.log('Tin nhắn đã đọc:', data);
  // data: { messageId, chatId, userId }
});
```

#### Lắng nghe lỗi
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "avatar" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE',
  "lastSeen" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
```

### Chats Table
```sql
CREATE TABLE "Chat" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "type" "ChatType" NOT NULL DEFAULT 'DIRECT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);
```

### Messages Table
```sql
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" "MessageType" NOT NULL DEFAULT 'TEXT',
  "senderId" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
```

### AI Chats Table
```sql
CREATE TABLE "AIChat" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIChat_pkey" PRIMARY KEY ("id")
);
```

### AI Messages Table
```sql
CREATE TABLE "AIMessage" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "role" "AIRole" NOT NULL,
  "aiChatId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);
```

## 🔧 Scripts và Commands

### Database Scripts

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate:dev

# Deploy migrations (production)
pnpm db:migrate:deploy

# Reset database
pnpm db:migrate:reset

# Check migration status
pnpm db:migrate:status

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

### Setup Scripts

```bash
# Setup đơn giản (khuyến nghị)
pnpm setup:simple

# Setup đầy đủ với kiểm tra PostgreSQL
pnpm setup:db

# Setup development
pnpm setup:dev

# Setup production
pnpm setup:prod
```

### Migration Scripts

```bash
# Development migration
pnpm migrate:dev

# Production migration
pnpm migrate:prod
```

## 🐳 Docker Development

### Khởi động với Docker Compose
```bash
# Khởi động tất cả services
docker-compose -f docker-compose.dev.yml up -d

# Chỉ khởi động PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Dừng services
docker-compose -f docker-compose.dev.yml down
```

### Docker Commands
```bash
# Build development image
docker build -f Dockerfile.dev -t smartchat-dev .

# Chạy container
docker run -p 51213:51213 smartchat-dev

# Vào container
docker exec -it smartchat_app bash
```

## 🔍 Troubleshooting

### Lỗi kết nối PostgreSQL

#### "Connection refused"
```bash
# Kiểm tra PostgreSQL service
net start postgresql-x64-16

# Hoặc dùng Docker
docker-compose -f docker-compose.dev.yml up -d postgres
```

#### "Command not found: pg_isready"
```bash
# Thêm PostgreSQL vào PATH
# Thêm: C:\Program Files\PostgreSQL\16\bin

# Hoặc dùng full path
"C:\Program Files\PostgreSQL\16\bin\pg_isready.exe" -h localhost
```

### Lỗi Prisma

#### "Module '@prisma/client' has no exported member 'PrismaClient'"
```bash
# Generate Prisma client
pnpm prisma generate
```

#### "Property 'user' does not exist on type 'PrismaService'"
```bash
# Regenerate Prisma client
pnpm prisma generate
```

### Lỗi JWT

#### "JWT_SECRET is not defined"
```bash
# Kiểm tra file .env
cat .env

# Đảm bảo JWT_SECRET được set
echo "JWT_SECRET=your-secret-key" >> .env
```

## 🚀 Deployment

### Production Setup

1. **Cấu hình production environment:**
   ```bash
   cp .env.production .env
   # Chỉnh sửa DATABASE_URL và JWT_SECRET
   ```

2. **Build application:**
   ```bash
   pnpm build
   ```

3. **Setup production database:**
   ```bash
   pnpm setup:prod
   ```

4. **Start production server:**
   ```bash
   pnpm start:prod
   ```

### Docker Production

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 51213

# Start production server
CMD ["npm", "run", "start:prod"]
```

## 📊 Monitoring và Logs

### Log Levels
- `debug`: Development mode
- `info`: Production mode
- `error`: Lỗi hệ thống

### Health Check
```http
GET /health
```

### Metrics
```http
GET /metrics
```

## 🔒 Security

### JWT Authentication
- Tất cả API endpoints (trừ auth) yêu cầu JWT token
- Token format: `Authorization: Bearer <token>`
- Token expiration: 24 hours

### CORS Configuration
```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

### Password Hashing
- Sử dụng bcryptjs với salt rounds: 10
- Passwords được hash trước khi lưu database

## 🧪 Testing

### Unit Tests
```bash
# Chạy tất cả tests
pnpm test

# Chạy tests với watch mode
pnpm test:watch

# Chạy tests với coverage
pnpm test:cov
```

### E2E Tests
```bash
# Chạy E2E tests
pnpm test:e2e
```

### API Tests
```bash
# Test với Swagger UI
# Truy cập: http://localhost:51213/api
```

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Tạo Pull Request

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem Swagger UI tại `/api`
- **Database**: Sử dụng Prisma Studio tại `pnpm db:studio`
