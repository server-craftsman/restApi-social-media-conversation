import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../roles/decorators/current-user.decorator';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
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
    create(@Body() createChatDto: CreateChatDto, @CurrentUser() user: any) {
        return this.chatService.createChat(createChatDto, user.id);
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
    getUserChats(@CurrentUser() user: any) {
        return this.chatService.getUserChats(user.id);
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
    getChatById(@Param('id') id: string, @CurrentUser() user: any) {
        return this.chatService.getChatById(id, user.id);
    }

    @Get(':id/messages')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy tin nhắn của chat',
        description: 'Lấy danh sách tin nhắn của một chat với pagination',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số lượng tin nhắn tối đa (mặc định: 50)',
        example: 50,
        required: false,
    })
    @ApiQuery({
        name: 'offset',
        description: 'Số tin nhắn bỏ qua (mặc định: 0)',
        example: 0,
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách tin nhắn thành công',
        schema: {
            type: 'object',
            properties: {
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            content: { type: 'string' },
                            type: { type: 'string' },
                            sender: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    avatar: { type: 'string' },
                                },
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            isRead: { type: 'boolean' },
                        },
                    },
                },
                pagination: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        limit: { type: 'number' },
                        offset: { type: 'number' },
                        hasMore: { type: 'boolean' },
                    },
                },
            },
        },
    })
    getChatMessages(
        @Param('id') id: string,
        @Query('limit') limit: string = '50',
        @Query('offset') offset: string = '0',
        @CurrentUser() user: any
    ) {
        return this.chatService.getChatMessages(
            id,
            user.id,
            parseInt(limit),
            parseInt(offset)
        );
    }

    @Post(':id/messages')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Gửi tin nhắn',
        description: 'Gửi tin nhắn đến một chat',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 201,
        description: 'Gửi tin nhắn thành công',
    })
    @ApiResponse({
        status: 403,
        description: 'Bạn không phải thành viên của chat này',
    })
    sendMessage(
        @Param('id') id: string,
        @Body() sendMessageDto: SendMessageDto,
        @CurrentUser() user: any
    ) {
        return this.chatService.sendMessage(id, user.id, sendMessageDto);
    }

    @Patch(':chatId/messages/:messageId/read')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Đánh dấu tin nhắn đã đọc',
        description: 'Đánh dấu một tin nhắn là đã đọc',
    })
    @ApiParam({
        name: 'chatId',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiParam({
        name: 'messageId',
        description: 'ID của tin nhắn',
        example: 'msg_123456',
    })
    @ApiResponse({
        status: 200,
        description: 'Đánh dấu thành công',
    })
    markMessageAsRead(
        @Param('chatId') chatId: string,
        @Param('messageId') messageId: string,
        @CurrentUser() user: any
    ) {
        return this.chatService.markMessageAsRead(messageId, user.id);
    }

    @Get(':id/unread-count')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Lấy số tin nhắn chưa đọc',
        description: 'Lấy số lượng tin nhắn chưa đọc trong chat',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'Số tin nhắn chưa đọc',
        schema: {
            type: 'object',
            properties: {
                unreadCount: { type: 'number', example: 5 },
            },
        },
    })
    getUnreadCount(@Param('id') id: string, @CurrentUser() user: any) {
        return this.chatService.getUnreadCount(id, user.id);
    }

    @Get(':id/search')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Tìm kiếm tin nhắn',
        description: 'Tìm kiếm tin nhắn trong chat theo từ khóa',
    })
    @ApiParam({
        name: 'id',
        description: 'ID của chat',
        example: 'clx1234567890',
    })
    @ApiQuery({
        name: 'q',
        description: 'Từ khóa tìm kiếm',
        example: 'hello',
        required: true,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Số kết quả tối đa (mặc định: 20)',
        example: 20,
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Kết quả tìm kiếm',
    })
    searchMessages(
        @Param('id') id: string,
        @Query('q') query: string,
        @Query('limit') limit: string = '20',
        @CurrentUser() user: any
    ) {
        return this.chatService.searchMessages(id, user.id, query, parseInt(limit));
    }
} 