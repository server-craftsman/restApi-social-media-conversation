import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendAIMessageDto {
    @ApiProperty({
        description: 'Nội dung tin nhắn gửi cho AI',
        example: 'Bạn có thể giúp tôi giải thích về machine learning không?',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
