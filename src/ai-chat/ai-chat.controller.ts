import { Controller, Get, Post, Body, Param, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AIChatService } from './ai-chat.service';
import { CreateAIChatDto } from './dto/create-ai-chat.dto';
import { SendAIMessageDto } from './dto/send-ai-message.dto';

@ApiTags('AI Chat')
@Controller('ai-chats')
export class AIChatController {
    constructor(private readonly aiChatService: AIChatService) { }

    @Post()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo AI chat mới',
        description: 'Tạo một cuộc trò chuyện mới với AI assistant',
    })
    @ApiResponse({
        status: 201,
        description: 'Tạo AI chat thành công',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'clx1234567890' },
                userId: { type: 'string' },
                title: { type: 'string', example: 'Hỗ trợ kỹ thuật' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            content: { type: 'string' },
                            role: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        },
    })
    create(@Body() createAIChatDto: CreateAIChatDto, @Request() req) {
        return this.aiChatService.createAIChat(req.user.id, createAIChatDto);
    }

    @Get()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách AI chat của user',
        description: 'Trả về tất cả AI chat mà user hiện tại đã tạo',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách AI chat thành công',
    })
    getUserAIChats(@Request() req) {
        return this.aiChatService.getUserAIChats(req.user.id);
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy tin nhắn AI chat theo ID',
        description: 'Trả về tất cả tin nhắn trong một AI chat',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của AI chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'Tin nhắn AI chat thành công',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy AI chat',
    })
    getAIChatMessages(@Param('id') id: string, @Request() req) {
        return this.aiChatService.getAIChatMessages(id, req.user.id);
    }

    @Post(':id/messages')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Gửi tin nhắn cho AI',
        description: 'Gửi tin nhắn cho AI assistant và nhận phản hồi',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của AI chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 201,
        description: 'Gửi tin nhắn thành công',
        schema: {
            type: 'object',
            properties: {
                userMessage: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        content: { type: 'string' },
                        role: { type: 'string', example: 'USER' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                aiMessage: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        content: { type: 'string' },
                        role: { type: 'string', example: 'ASSISTANT' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy AI chat',
    })
    sendAIMessage(
        @Param('id') id: string,
        @Body() sendAIMessageDto: SendAIMessageDto,
        @Request() req
    ) {
        return this.aiChatService.sendAIMessage(id, req.user.id, sendAIMessageDto);
    }

    @Delete(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Xóa AI chat',
        description: 'Xóa một AI chat và tất cả tin nhắn liên quan',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của AI chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'Xóa AI chat thành công',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'AI Chat deleted successfully' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy AI chat',
    })
    deleteAIChat(@Param('id') id: string, @Request() req) {
        return this.aiChatService.deleteAIChat(id, req.user.id);
    }
} 