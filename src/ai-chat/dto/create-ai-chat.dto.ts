import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAIChatDto {
    @ApiPropertyOptional({
        description: 'Tiêu đề của AI chat',
        example: 'Hỗ trợ kỹ thuật',
        type: String,
    })
    @IsOptional()
    @IsString()
    title?: string;
}
