# Email Verification Setup

## Cấu hình Email Service

### 1. Cập nhật .env file

Cập nhật các thông tin email trong file `.env`:

```env
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_EMAIL=your-email@gmail.com
MAIL_DEFAULT_NAME=SmartChat
MAIL_IGNORE_TLS=false
MAIL_SECURE=false
MAIL_REQUIRE_TLS=true

# App Configuration
APP_NAME=SmartChat
APP_FRONTEND_DOMAIN=http://localhost:3000
APP_WORKING_DIRECTORY=.
```

### 2. Cấu hình Gmail (nếu sử dụng Gmail)

1. **Bật 2-Factor Authentication** trên tài khoản Google
2. **Tạo App Password**:
   - Vào Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Tạo password cho "Mail"
   - Sử dụng password này cho `MAIL_PASSWORD`

### 3. Cấu hình khác

#### Outlook/Hotmail:
```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
```

#### Yahoo:
```env
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
```

#### Custom SMTP:
```env
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USER=your-username
MAIL_PASSWORD=your-password
```

## API Endpoints

### 1. Đăng ký với Email Verification
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "username": "john_doe",
    "isVerified": false,
    // ... other user fields
  }
}
```

### 2. Xác thực Email
```http
POST /auth/verify-email/{hash}
```

### 3. Gửi lại Email Xác thực
```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Email Templates

Các template email được lưu trong `src/mail/mail-templates/`:

- `activation.hbs` - Email xác thực tài khoản
- `reset-password.hbs` - Email reset password
- `confirm-new-email.hbs` - Email xác thực email mới

## Testing Email

### 1. Sử dụng Mailtrap (Development)
```env
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-user
MAIL_PASSWORD=your-mailtrap-password
```

### 2. Sử dụng Ethereal Email (Testing)
```javascript
// Trong mailer.service.ts, thêm:
const testAccount = await nodemailer.createTestAccount();
this.transporter = nodemailer.createTransporter({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});
```

## Troubleshooting

### 1. Lỗi Authentication
- Kiểm tra username/password
- Đảm bảo đã bật "Less secure app access" hoặc sử dụng App Password

### 2. Lỗi Connection
- Kiểm tra MAIL_HOST và MAIL_PORT
- Đảm bảo firewall không chặn port

### 3. Email không gửi được
- Kiểm tra logs trong console
- Đảm bảo template files tồn tại
- Kiểm tra frontend domain trong config

## Security Notes

1. **Không commit .env file** vào git
2. **Sử dụng App Password** thay vì password chính
3. **Rotate secrets** định kỳ
4. **Monitor email logs** để phát hiện spam 