import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupType, GroupCategory } from '../domain/enums';

export class CreateGroupDto {
    @ApiProperty({
        description: 'Tên nhóm',
        example: 'Cộng đồng lập trình viên Việt Nam',
        maxLength: 100
    })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({
        description: 'Mô tả nhóm',
        example: 'Nhóm dành cho các lập trình viên Việt Nam chia sẻ kiến thức và kinh nghiệm',
        maxLength: 500
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Avatar của nhóm',
        example: 'https://example.com/group-avatar.jpg'
    })
    @IsOptional()
    @IsUrl()
    avatar?: string;

    @ApiPropertyOptional({
        description: 'Ảnh bìa của nhóm',
        example: 'https://example.com/group-cover.jpg'
    })
    @IsOptional()
    @IsUrl()
    coverImage?: string;

    @ApiProperty({
        description: 'Loại nhóm',
        enum: GroupType,
        example: GroupType.PUBLIC
    })
    @IsEnum(GroupType)
    type: GroupType;

    @ApiPropertyOptional({
        description: 'Danh mục nhóm',
        enum: GroupCategory,
        example: GroupCategory.TECHNOLOGY
    })
    @IsOptional()
    @IsEnum(GroupCategory)
    category?: GroupCategory;

    @ApiPropertyOptional({
        description: 'Cho phép mọi người tham gia mà không cần phê duyệt',
        example: true,
        default: false
    })
    @IsOptional()
    @IsBoolean()
    allowAutoJoin?: boolean = false;

    @ApiPropertyOptional({
        description: 'Danh sách ID các thành viên ban đầu',
        example: ['user1_id', 'user2_id'],
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    initialMemberIds?: string[];

    @ApiPropertyOptional({
        description: 'Tags của nhóm',
        example: ['programming', 'javascript', 'nodejs'],
        type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
} 