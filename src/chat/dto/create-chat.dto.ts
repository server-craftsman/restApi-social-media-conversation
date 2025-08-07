import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatType } from '../domain/enums';

export class CreateChatDto {
    @ApiPropertyOptional({
        description: 'Tên của chat (bắt buộc cho group chat)',
        example: 'Nhóm bạn thân',
        type: String,
        minLength: 1,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @ApiProperty({
        description: 'Danh sách ID của các thành viên tham gia chat',
        example: ['user1_id', 'user2_id'],
        type: [String],
        isArray: true,
        minItems: 1,
        maxItems: 50,
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    memberIds: string[];

    @ApiPropertyOptional({
        description: 'Loại chat (DIRECT hoặc GROUP)',
        example: 'DIRECT',
        enum: ChatType,
        default: ChatType.DIRECT,
    })
    @IsOptional()
    @IsEnum(ChatType)
    type?: ChatType = ChatType.DIRECT;

    @ApiPropertyOptional({
        description: 'Mô tả nhóm (chỉ cho group chat)',
        example: 'Nhóm chat cho bạn bè thân thiết',
        type: String,
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Avatar của chat',
        example: 'https://example.com/avatar.jpg',
        type: String,
    })
    @IsOptional()
    @IsString()
    avatar?: string;
} 