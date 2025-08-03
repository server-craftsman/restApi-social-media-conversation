import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/domain/entities/user.entity';
import { UserRole } from '../user/domain/interfaces/user.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) { }

    async validateUser(emailOrUsername: string, password: string): Promise<User | null> {
        if (!emailOrUsername || !password) {
            return null;
        }

        const user = await this.userService.findUserByEmailOrUsername(emailOrUsername);
        if (!user) {
            return null;
        }

        // Check if user is active
        if (!user.isActive) {
            return null;
        }

        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async register(userData: any) {
        console.log('=== AUTH SERVICE REGISTER START ===');
        console.log('AuthService.register called with:', {
            email: userData.email,
            username: userData.username,
        });

        try {
            // Create user
            console.log('Creating user...');
            const user = await this.userService.createUser(userData);
            console.log('User created successfully:', {
                id: user.id,
                email: user.email,
                username: user.username,
            });

            // Generate verification hash
            console.log('Generating verification hash...');
            const verificationHash = randomBytes(32).toString('hex');
            console.log('Generated verification hash:', verificationHash);

            // Save verification hash to database
            console.log('Saving verification hash to database...');
            await this.userService.updateUser(user.id, {
                hash: verificationHash,
                hashExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });
            console.log('✅ Verification hash saved to database');

            // Send verification email
            try {
                console.log('Attempting to send verification email to:', user.email);
                console.log('MailService instance:', !!this.mailService);

                await this.mailService.userSignUp({
                    to: user.email,
                    data: {
                        hash: verificationHash,
                    },
                });
                console.log('✅ Verification email sent successfully');
            } catch (error) {
                console.error('❌ Failed to send verification email:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                });
                // Don't fail registration if email fails
                // In production, you might want to queue this for retry
            }

            console.log('=== AUTH SERVICE REGISTER END ===');
            return {
                message: 'Registration successful. Please check your email to verify your account.',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    bio: user.bio,
                    location: user.location,
                    website: user.website,
                    role: user.role,
                    status: user.status,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                    lastSeen: user.lastSeen,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            };
        } catch (error) {
            console.error('❌ Error in register method:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    async login(loginDto: LoginDto) {
        if (!loginDto.emailOrUsername || !loginDto.password) {
            throw new BadRequestException('Email/username and password are required');
        }

        const user = await this.validateUser(loginDto.emailOrUsername, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Update user status to online
        await this.userService.setUserOnline(user.id);

        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                avatar: user.avatar,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bio: user.bio,
                location: user.location,
                website: user.website,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                isActive: user.isActive,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }

    async logout(userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        await this.userService.setUserOffline(userId);
        return { message: 'Logged out successfully' };
    }

    async refreshToken(userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
        };
    }

    async verifyToken(token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        try {
            const payload = this.jwtService.verify(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async hasPermission(userId: string, requiredRole: UserRole): Promise<boolean> {
        if (!userId || !requiredRole) {
            return false;
        }

        const user = await this.userService.findUserById(userId);
        if (!user) {
            return false;
        }

        const roleHierarchy = {
            [UserRole.USER]: 1,
            [UserRole.MODERATOR]: 2,
            [UserRole.ADMIN]: 3,
            [UserRole.SUPER_ADMIN]: 4,
        };

        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }

    async verifyEmail(hash: string) {
        console.log('=== AUTH SERVICE VERIFY EMAIL START ===');
        console.log('Verifying email with hash:', hash);

        if (!hash) {
            throw new BadRequestException('Verification hash is required');
        }

        try {
            // Find user by verification hash
            console.log('Looking for user with verification hash...');
            const user = await this.userService.findUserByVerificationHash(hash);

            if (!user) {
                console.log('❌ No user found with verification hash');
                throw new BadRequestException('Invalid verification hash');
            }

            // Check if hash has expired
            if (user.hashExpires && user.hashExpires < new Date()) {
                console.log('❌ Verification hash has expired');
                throw new BadRequestException('Verification hash has expired');
            }

            // Update user verification status
            console.log('Updating user verification status...');
            await this.userService.updateUser(user.id, {
                isVerified: true,
                hash: undefined,
                hashExpires: undefined,
            });

            console.log('✅ Email verification successful');
            console.log('=== AUTH SERVICE VERIFY EMAIL END ===');

            return {
                message: 'Email verified successfully',
                verified: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    isVerified: true,
                },
            };
        } catch (error) {
            console.error('❌ Error in verifyEmail:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Invalid verification hash');
        }
    }

    async resendVerificationEmail(email: string) {
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('User is already verified');
        }

        // Generate new verification hash
        const verificationHash = randomBytes(32).toString('hex');

        // Send verification email
        try {
            await this.mailService.userSignUp({
                to: user.email,
                data: {
                    hash: verificationHash,
                },
            });
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }

        return { message: 'Verification email sent successfully' };
    }
} 