import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsUrl, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FriendRequestStatus, StatusType, ActivityType } from '../domain/enums';

export class SendFriendRequestDto {
    @ApiProperty({
        description: 'ID của user muốn kết bạn',
        example: 'user_id_123'
    })
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({
        description: 'Tin nhắn kèm theo lời mời kết bạn',
        example: 'Xin chào! Tôi muốn kết bạn với bạn.',
        maxLength: 200
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    message?: string;
}

export class RespondFriendRequestDto {
    @ApiProperty({
        description: 'Phản hồi với lời mời kết bạn',
        enum: ['ACCEPTED', 'DECLINED', 'BLOCKED'],
        example: 'ACCEPTED'
    })
    @IsEnum(['ACCEPTED', 'DECLINED', 'BLOCKED'])
    response: 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
}

export class UpdateStatusDto {
    @ApiProperty({
        description: 'Loại trạng thái',
        enum: StatusType,
        example: StatusType.AVAILABLE
    })
    @IsEnum(StatusType)
    type: StatusType;

    @ApiPropertyOptional({
        description: 'Tin nhắn trạng thái tùy chỉnh',
        example: 'Đang làm việc 💻',
        maxLength: 100
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    customMessage?: string;

    @ApiPropertyOptional({
        description: 'Emoji đại diện cho trạng thái',
        example: '💻'
    })
    @IsOptional()
    @IsString()
    emoji?: string;

    @ApiPropertyOptional({
        description: 'Thời gian tự động clear status (phút)',
        example: 60
    })
    @IsOptional()
    autoClearAfter?: number;
}

export class UpdateActivityDto {
    @ApiProperty({
        description: 'Loại hoạt động',
        enum: ActivityType,
        example: ActivityType.TYPING
    })
    @IsEnum(ActivityType)
    activity: ActivityType;

    @ApiPropertyOptional({
        description: 'ID chat đang hoạt động (nếu có)',
        example: 'chat_id_123'
    })
    @IsOptional()
    @IsUUID()
    chatId?: string;

    @ApiPropertyOptional({
        description: 'Thông tin chi tiết về hoạt động',
        example: 'Đang chơi Dota 2'
    })
    @IsOptional()
    @IsString()
    details?: string;
}

export class CreateStoryDto {
    @ApiProperty({
        description: 'Nội dung story',
        example: 'Hôm nay là một ngày tuyệt vời! ☀️',
        maxLength: 500
    })
    @IsString()
    @MaxLength(500)
    content: string;

    @ApiPropertyOptional({
        description: 'URL media của story',
        example: 'https://example.com/story-image.jpg'
    })
    @IsOptional()
    @IsUrl()
    mediaUrl?: string;

    @ApiPropertyOptional({
        description: 'Loại media',
        enum: ['IMAGE', 'VIDEO'],
        example: 'IMAGE'
    })
    @IsOptional()
    @IsEnum(['IMAGE', 'VIDEO'])
    mediaType?: 'IMAGE' | 'VIDEO';

    @ApiPropertyOptional({
        description: 'Thời gian story tự động xóa (giờ)',
        example: 24,
        default: 24
    })
    @IsOptional()
    autoDeleteAfterHours?: number = 24;

    @ApiPropertyOptional({
        description: 'Cho phép ai reply story',
        enum: ['EVERYONE', 'FRIENDS', 'CLOSE_FRIENDS', 'NO_ONE'],
        example: 'FRIENDS',
        default: 'FRIENDS'
    })
    @IsOptional()
    allowReplies?: 'EVERYONE' | 'FRIENDS' | 'CLOSE_FRIENDS' | 'NO_ONE' = 'FRIENDS';
}

export class JoinGroupDto {
    @ApiPropertyOptional({
        description: 'Tin nhắn xin gia nhập nhóm',
        example: 'Xin chào! Tôi muốn tham gia nhóm này.',
        maxLength: 200
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    message?: string;
}

export class SearchDto {
    @ApiProperty({
        description: 'Từ khóa tìm kiếm',
        example: 'javascript programming',
        maxLength: 100
    })
    @IsString()
    @MaxLength(100)
    query: string;

    @ApiPropertyOptional({
        description: 'Loại tìm kiếm',
        enum: ['ALL', 'USERS', 'GROUPS', 'MESSAGES'],
        example: 'ALL',
        default: 'ALL'
    })
    @IsOptional()
    @IsEnum(['ALL', 'USERS', 'GROUPS', 'MESSAGES'])
    type?: 'ALL' | 'USERS' | 'GROUPS' | 'MESSAGES' = 'ALL';

    @ApiPropertyOptional({
        description: 'Số lượng kết quả trên mỗi trang',
        example: 20,
        default: 20
    })
    @IsOptional()
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Số trang',
        example: 1,
        default: 1
    })
    @IsOptional()
    page?: number = 1;
} 