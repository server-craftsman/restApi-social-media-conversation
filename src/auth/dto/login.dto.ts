import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Email hoặc username của người dùng',
        example: 'user@example.com',
        type: String,
    })
    @IsString()
    emailOrUsername: string;

    @ApiProperty({
        description: 'Mật khẩu của người dùng',
        example: 'password123',
        minLength: 6,
        type: String,
    })
    @IsString()
    @MinLength(6)
    password: string;
} 