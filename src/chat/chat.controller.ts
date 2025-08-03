import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chats')
@Controller('chats')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tạo chat mới',
        description: 'Tạo chat 1-1 hoặc nhóm chat với các thành viên',
    })
    @ApiResponse({
        status: 201,
        description: 'Tạo chat thành công',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'clx1234567890' },
                name: { type: 'string', example: 'Nhóm bạn thân' },
                type: { type: 'string', example: 'GROUP' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                members: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            userId: { type: 'string' },
                            chatId: { type: 'string' },
                            role: { type: 'string', example: 'ADMIN' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    avatar: { type: 'string' },
                                    status: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
    })
    create(@Body() createChatDto: CreateChatDto, @Request() req) {
        return this.chatService.createChat(createChatDto, req.user.id);
    }

    @Get()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy danh sách chat của user',
        description: 'Trả về tất cả chat mà user hiện tại tham gia',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách chat thành công',
    })
    getUserChats(@Request() req) {
        return this.chatService.getUserChats(req.user.id);
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy thông tin chat theo ID',
        description: 'Trả về thông tin chi tiết của một chat',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'Thông tin chat thành công',
    })
    @ApiResponse({
        status: 403,
        description: 'Bạn không phải thành viên của chat này',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy chat',
    })
    getChatById(@Param('id') id: string, @Request() req) {
        return this.chatService.getChatById(id, req.user.id);
    }

    @Get(':id/messages')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy tin nhắn của chat',
        description: 'Trả về danh sách tin nhắn trong chat với phân trang',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng tin nhắn tối đa trả về',
        example: 50,
        required: false,
    })
    @ApiQuery({
        name: 'offset',
        description: 'Số tin nhắn bỏ qua (cho phân trang)',
        example: 0,
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách tin nhắn thành công',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'clx1234567890' },
                    content: { type: 'string', example: 'Xin chào!' },
                    type: { type: 'string', example: 'TEXT' },
                    senderId: { type: 'string' },
                    chatId: { type: 'string' },
                    isRead: { type: 'boolean', example: false },
                    createdAt: { type: 'string', format: 'date-time' },
                    sender: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            username: { type: 'string' },
                            avatar: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Bạn không phải thành viên của chat này',
    })
    getChatMessages(
        @Param('id') id: string,
        @Query('limit') limit: string = '50',
        @Query('offset') offset: string = '0',
        @Request() req
    ) {
        return this.chatService.getChatMessages(id, req.user.id, parseInt(limit), parseInt(offset));
    }

    @Post(':id/messages')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Gửi tin nhắn trong chat',
        description: 'Gửi tin nhắn mới vào chat và lưu vào database',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 201,
        description: 'Gửi tin nhắn thành công',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'clx1234567890' },
                content: { type: 'string', example: 'Xin chào!' },
                type: { type: 'string', example: 'TEXT' },
                senderId: { type: 'string' },
                chatId: { type: 'string' },
                isRead: { type: 'boolean', example: false },
                createdAt: { type: 'string', format: 'date-time' },
                sender: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        avatar: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Bạn không phải thành viên của chat này',
    })
    sendMessage(
        @Param('id') id: string,
        @Body() sendMessageDto: SendMessageDto,
        @Request() req
    ) {
        return this.chatService.sendMessage(id, req.user.id, sendMessageDto);
    }
} 