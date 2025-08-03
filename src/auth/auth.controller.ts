import {
    Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, Request, Param, HttpException
} from '@nestjs/common';
import {
    ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ICreateUser } from '../user/domain/interfaces/user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiResponseDto, ErrorResponseDto } from '../common/dto/api-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) { }

    @Post('register')
    @ApiOperation({
        summary: 'Đăng ký người dùng mới',
        description: 'Tạo tài khoản người dùng mới với thông tin chi tiết và gửi email xác thực',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Đăng ký thành công - email xác thực đã được gửi',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 201,
                message: 'Registration successful. Please check your email to verify your account.',
                data: {
                    user: {
                        id: 'user-123',
                        email: 'user@example.com',
                        username: 'john_doe',
                        firstName: 'John',
                        lastName: 'Doe',
                        fullName: 'John Doe',
                        avatar: 'https://example.com/avatar.jpg',
                        phone: '+84123456789',
                        dateOfBirth: '1990-01-01T00:00:00.000Z',
                        gender: 'MALE',
                        bio: 'Tôi là một developer',
                        location: 'Hà Nội, Việt Nam',
                        website: 'https://example.com',
                        role: 'USER',
                        status: 'OFFLINE',
                        isVerified: false,
                        isActive: true,
                        lastSeen: '2024-01-01T00:00:00.000Z',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z',
                    },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email hoặc username đã tồn tại',
        type: ErrorResponseDto,
    })
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto> {
        console.log('=== AUTH CONTROLLER REGISTER START ===');
        console.log('Received registration request:', {
            email: createUserDto.email,
            username: createUserDto.username,
        });

        try {
            const userData: ICreateUser = {
                email: createUserDto.email,
                username: createUserDto.username,
                password: createUserDto.password,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                phone: createUserDto.phone,
                dateOfBirth: createUserDto.dateOfBirth,
                gender: createUserDto.gender,
                bio: createUserDto.bio,
                location: createUserDto.location,
                website: createUserDto.website,
                avatar: createUserDto.avatar,
                role: createUserDto.role,
            };

            console.log('Calling AuthService.register...');
            const result = await this.authService.register(userData);
            console.log('✅ Registration completed successfully');
            console.log('=== AUTH CONTROLLER REGISTER END ===');

            return {
                statusCode: 201,
                message: result.message,
                data: result,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Error in AuthController.register:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    @Post('login')
    @ApiOperation({
        summary: 'Đăng nhập người dùng',
        description: 'Đăng nhập bằng email/username và password, trả về JWT token',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Đăng nhập thành công',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 200,
                message: 'Login successful',
                data: {
                    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    user: {
                        id: 'user-123',
                        email: 'user@example.com',
                        username: 'john_doe',
                        firstName: 'John',
                        lastName: 'Doe',
                        fullName: 'John Doe',
                        avatar: 'https://example.com/avatar.jpg',
                        phone: '+84123456789',
                        dateOfBirth: '1990-01-01T00:00:00.000Z',
                        gender: 'MALE',
                        bio: 'Tôi là một developer',
                        location: 'Hà Nội, Việt Nam',
                        website: 'https://example.com',
                        role: 'USER',
                        status: 'ONLINE',
                        isVerified: true,
                        isActive: true,
                        lastSeen: '2024-01-01T00:00:00.000Z',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z',
                    },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Thông tin đăng nhập không đúng',
        type: ErrorResponseDto,
    })
    async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto> {
        const result = await this.authService.login(loginDto);
        return {
            statusCode: 200,
            message: 'Login successful',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Đăng xuất người dùng',
        description: 'Đăng xuất và cập nhật trạng thái offline',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Đăng xuất thành công',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 200,
                message: 'Logout successful',
                data: {
                    message: 'Logged out successfully',
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    async logout(@Request() req): Promise<ApiResponseDto> {
        const result = await this.authService.logout(req.user.sub);
        return {
            statusCode: 200,
            message: 'Logout successful',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Lấy thông tin profile người dùng',
        description: 'Lấy thông tin chi tiết của người dùng đang đăng nhập',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thông tin profile',
        type: ApiResponseDto,
    })
    async getProfile(@Request() req): Promise<ApiResponseDto> {
        const user = await this.userService.findUserById(req.user.sub);
        return {
            statusCode: 200,
            message: 'Profile retrieved successfully',
            data: { user },
            timestamp: new Date().toISOString(),
        };
    }

    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Làm mới JWT token',
        description: 'Tạo JWT token mới cho người dùng',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Token được làm mới thành công',
        type: ApiResponseDto,
    })
    async refreshToken(@Request() req): Promise<ApiResponseDto> {
        const result = await this.authService.refreshToken(req.user.sub);
        return {
            statusCode: 200,
            message: 'Token refreshed successfully',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('verify-email/:hash')
    @ApiOperation({
        summary: 'Xác thực email',
        description: 'Xác thực email bằng hash từ link trong email',
    })
    @ApiParam({
        name: 'hash',
        description: 'Hash xác thực từ email',
        example: 'abc123def456...',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email xác thực thành công',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 200,
                message: 'Email verification successful',
                data: {
                    message: 'Email verified successfully',
                    verified: true,
                    user: {
                        id: 'user-123',
                        email: 'user@example.com',
                        username: 'john_doe',
                        isVerified: true,
                    },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Hash không hợp lệ hoặc đã hết hạn',
        type: ErrorResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Param('hash') hash: string): Promise<ApiResponseDto> {
        const result = await this.authService.verifyEmail(hash);
        return {
            statusCode: 200,
            message: 'Email verification successful',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('resend-verification')
    @ApiOperation({
        summary: 'Gửi lại email xác thực',
        description: 'Gửi lại email xác thực cho user chưa verify',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email xác thực đã được gửi lại',
        type: ApiResponseDto,
        schema: {
            example: {
                statusCode: 200,
                message: 'Verification email sent successfully',
                data: {
                    message: 'Verification email sent successfully',
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'User không tồn tại hoặc đã verify',
        type: ErrorResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    async resendVerificationEmail(@Body() resendVerificationDto: ResendVerificationDto): Promise<ApiResponseDto> {
        const result = await this.authService.resendVerificationEmail(resendVerificationDto.email);
        return {
            statusCode: 200,
            message: 'Verification email sent successfully',
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
} 