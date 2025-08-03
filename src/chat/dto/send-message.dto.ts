import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        description: 'Nội dung tin nhắn',
        example: 'Xin chào! Bạn khỏe không?',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({
        description: 'Loại tin nhắn',
        example: 'TEXT',
        enum: ['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO'],
        default: 'TEXT',
    })
    @IsOptional()
    @IsString()
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' = 'TEXT';
} 