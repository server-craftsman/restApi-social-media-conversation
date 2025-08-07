import { IsString, IsOptional, IsArray, IsEnum, IsUUID, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, ReactionType } from '../domain/enums';

export class SendEnhancedMessageDto {
    @ApiProperty({
        description: 'Nội dung tin nhắn',
        example: 'Xin chào @john! Bạn có xem video này chưa? 🎥',
        maxLength: 5000
    })
    @IsString()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({
        description: 'Loại tin nhắn',
        enum: MessageType,
        example: MessageType.TEXT
    })
    @IsOptional()
    @IsEnum(MessageType)
    type?: MessageType = MessageType.TEXT;

    @ApiPropertyOptional({
        description: 'URL của media (nếu có)',
        example: 'https://example.com/image.jpg'
    })
    @IsOptional()
    @IsUrl()
    mediaUrl?: string;

    @ApiPropertyOptional({
        description: 'ID tin nhắn được trả lời (nếu đây là reply)',
        example: 'message_id_123'
    })
    @IsOptional()
    @IsUUID()
    replyToMessageId?: string;

    @ApiPropertyOptional({
        description: 'Danh sách ID users được mention',
        example: ['user1_id', 'user2_id'],
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mentionedUserIds?: string[];

    @ApiPropertyOptional({
        description: 'Hashtags trong tin nhắn',
        example: ['#programming', '#javascript'],
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hashtags?: string[];

    @ApiPropertyOptional({
        description: 'Metadata cho các loại tin nhắn đặc biệt',
        example: {
            fileName: 'document.pdf',
            fileSize: 1024000,
            duration: 120
        }
    })
    @IsOptional()
    metadata?: Record<string, any>;
}

export class ReactToMessageDto {
    @ApiProperty({
        description: 'Loại reaction',
        enum: ReactionType,
        example: ReactionType.LIKE
    })
    @IsEnum(ReactionType)
    reaction: ReactionType;
}

export class CreatePollDto {
    @ApiProperty({
        description: 'Câu hỏi poll',
        example: 'Bạn thích framework nào nhất?',
        maxLength: 200
    })
    @IsString()
    @MaxLength(200)
    question: string;

    @ApiProperty({
        description: 'Các lựa chọn trong poll',
        example: ['React', 'Vue', 'Angular', 'Svelte'],
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    options: string[];

    @ApiPropertyOptional({
        description: 'Cho phép multiple choice',
        example: false,
        default: false
    })
    @IsOptional()
    allowMultipleChoice?: boolean = false;

    @ApiPropertyOptional({
        description: 'Thời gian kết thúc poll (ISO string)',
        example: '2024-12-31T23:59:59Z'
    })
    @IsOptional()
    @IsString()
    expiresAt?: string;
} 