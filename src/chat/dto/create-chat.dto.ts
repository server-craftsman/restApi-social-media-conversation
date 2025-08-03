import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatDto {
    @ApiPropertyOptional({
        description: 'Tên của chat (bắt buộc cho group chat)',
        example: 'Nhóm bạn thân',
        type: String,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Danh sách ID của các thành viên tham gia chat',
        example: ['user1_id', 'user2_id'],
        type: [String],
        isArray: true,
    })
    @IsArray()
    @IsString({ each: true })
    memberIds: string[];
} 