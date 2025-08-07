import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../domain/enums';

export class SendMessageDto {
    @ApiProperty({
        description: 'Nội dung tin nhắn',
        example: 'Xin chào! Bạn khỏe không?',
        type: String,
        maxLength: 5000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({
        description: 'Loại tin nhắn',
        example: 'TEXT',
        enum: MessageType,
        default: 'TEXT',
    })
    @IsOptional()
    @IsEnum(MessageType)
    type?: MessageType = MessageType.TEXT;

    @ApiPropertyOptional({
        description: 'URL của file media (cho IMAGE, VIDEO, AUDIO, FILE)',
        example: 'https://example.com/image.jpg',
        type: String,
    })
    @IsOptional()
    @IsUrl()
    mediaUrl?: string;

    @ApiPropertyOptional({
        description: 'ID tin nhắn được reply (nếu có)',
        example: 'msg_123456',
        type: String,
    })
    @IsOptional()
    @IsString()
    replyToMessageId?: string;

    @ApiPropertyOptional({
        description: 'Metadata bổ sung cho tin nhắn',
        example: { duration: 30, fileSize: 1024 },
        type: 'object',
    })
    @IsOptional()
    metadata?: Record<string, any>;
} 