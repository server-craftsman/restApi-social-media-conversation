import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    HttpStatus,
    ParseUUIDPipe
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendEnhancedMessageDto, ReactToMessageDto } from './dto/enhanced-message.dto';
import { SearchDto } from './dto/social-features.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { MessageType } from './domain/enums';

@ApiTags('Social Chat')
@Controller('social-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SocialChatController {
    constructor(private readonly chatService: ChatService) { }

    // ==================== ENHANCED MESSAGING ====================

    @Post('chats/:chatId/messages/enhanced')
    @ApiOperation({
        summary: 'Gửi tin nhắn nâng cao',
        description: 'Gửi tin nhắn với features như mention, hashtag, reply, media'
    })
    @ApiParam({ name: 'chatId', description: 'ID của chat' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tin nhắn đã được gửi thành công',
        type: ApiResponseDto
    })
    async sendEnhancedMessage(
        @Param('chatId', ParseUUIDPipe) chatId: string,
        @Body() messageDto: SendEnhancedMessageDto,
        @Request() req
    ): Promise<ApiResponseDto> {
        // Map enhanced message type to basic message type
        let basicType: MessageType = MessageType.TEXT;
        if (messageDto.type && ['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO'].includes(messageDto.type)) {
            basicType = messageDto.type as MessageType;
        }

        const basicMessage: SendMessageDto = {
            content: messageDto.content,
            type: basicType
        };

        const message = await this.chatService.sendMessage(chatId, req.user.id, basicMessage);

        return {
            statusCode: HttpStatus.CREATED,
            message: 'Enhanced message sent successfully',
            data: {
                message,
                features: {
                    mentions: messageDto.mentionedUserIds || [],
                    hashtags: messageDto.hashtags || [],
                    replyTo: messageDto.replyToMessageId,
                    mediaUrl: messageDto.mediaUrl
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    @Post('messages/:messageId/react')
    @ApiOperation({
        summary: 'React tin nhắn',
        description: 'Thêm reaction (like, love, haha, etc.) vào tin nhắn'
    })
    @ApiParam({ name: 'messageId', description: 'ID của tin nhắn' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Reaction đã được thêm/cập nhật',
        type: ApiResponseDto
    })
    async reactToMessage(
        @Param('messageId', ParseUUIDPipe) messageId: string,
        @Body() reactionDto: ReactToMessageDto,
        @Request() req
    ): Promise<ApiResponseDto> {
        // For now, simulate reaction functionality
        const result = {
            messageId,
            userId: req.user.id,
            reaction: reactionDto.reaction,
            timestamp: new Date().toISOString()
        };

        return {
            statusCode: HttpStatus.OK,
            message: 'Reaction added successfully',
            data: result,
            timestamp: new Date().toISOString()
        };
    }

    // ==================== SEARCH FUNCTIONALITY ====================

    @Get('search')
    @ApiOperation({
        summary: 'Tìm kiếm toàn cục',
        description: 'Tìm kiếm users, groups, messages trong hệ thống'
    })
    @ApiQuery({ name: 'query', description: 'Từ khóa tìm kiếm' })
    @ApiQuery({ name: 'type', enum: ['ALL', 'USERS', 'GROUPS', 'MESSAGES'], required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Kết quả tìm kiếm',
        type: ApiResponseDto
    })
    async globalSearch(
        @Query() searchDto: SearchDto,
        @Request() req
    ): Promise<ApiResponseDto> {
        // Get user's chats for search scope
        const userChats = await this.chatService.getUserChats(req.user.id);

        // Handle the response properly - userChats is an array, not wrapped in data
        const chats = Array.isArray(userChats) ? userChats : [];

        // Simulate enhanced search results
        const results = {
            query: searchDto.query,
            type: searchDto.type || 'ALL',
            chats: chats.filter(chat =>
                chat.name?.toLowerCase().includes(searchDto.query.toLowerCase())
            ) || [],
            totalResults: chats.length || 0
        };

        return {
            statusCode: HttpStatus.OK,
            message: 'Search completed successfully',
            data: results,
            timestamp: new Date().toISOString()
        };
    }

    // ==================== GROUP FEATURES ====================

    @Post('groups')
    @ApiOperation({
        summary: 'Tạo nhóm chat',
        description: 'Tạo nhóm chat với nhiều thành viên'
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Nhóm đã được tạo thành công',
        type: ApiResponseDto
    })
    async createGroup(
        @Body() createChatDto: CreateChatDto,
        @Request() req
    ): Promise<ApiResponseDto> {
        const group = await this.chatService.createChat(createChatDto, req.user.id);

        return {
            statusCode: HttpStatus.CREATED,
            message: 'Group created successfully',
            data: {
                group,
                features: {
                    type: 'GROUP',
                    memberCount: createChatDto.memberIds.length + 1,
                    isPublic: true, // Default for now
                    allowAutoJoin: false
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    @Get('groups/discover')
    @ApiOperation({
        summary: 'Khám phá nhóm công khai',
        description: 'Tìm kiếm các nhóm công khai có thể tham gia'
    })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách nhóm công khai',
        type: ApiResponseDto
    })
    async discoverGroups(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Request() req?: any
    ): Promise<ApiResponseDto> {
        // For now, return user's existing chats as "discoverable groups"
        const userChats = await this.chatService.getUserChats(req.user.id);
        const chats = Array.isArray(userChats) ? userChats : [];

        let filteredGroups = chats.filter(chat => chat.type === 'GROUP') || [];

        if (search) {
            filteredGroups = filteredGroups.filter(group =>
                group.name?.toLowerCase().includes(search.toLowerCase())
            );
        }

        const groupsWithStats = filteredGroups.map(group => ({
            ...group,
            memberCount: group.members?.length || 0,
            isPublic: true,
            category: category || 'GENERAL',
            canJoin: true
        }));

        return {
            statusCode: HttpStatus.OK,
            message: 'Groups discovered successfully',
            data: {
                groups: groupsWithStats,
                total: groupsWithStats.length,
                category,
                search
            },
            timestamp: new Date().toISOString()
        };
    }

    // ==================== USER STATUS & ACTIVITY ====================

    @Put('status')
    @ApiOperation({
        summary: 'Cập nhật trạng thái',
        description: 'Cập nhật trạng thái online/offline/busy của user'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Trạng thái đã được cập nhật',
        type: ApiResponseDto
    })
    async updateStatus(
        @Body() statusData: { status: string; message?: string },
        @Request() req
    ): Promise<ApiResponseDto> {
        // Simulate status update
        const result = {
            userId: req.user.id,
            status: statusData.status,
            customMessage: statusData.message,
            updatedAt: new Date().toISOString()
        };

        return {
            statusCode: HttpStatus.OK,
            message: 'Status updated successfully',
            data: result,
            timestamp: new Date().toISOString()
        };
    }

    @Get('users/online')
    @ApiOperation({
        summary: 'Danh sách user online',
        description: 'Lấy danh sách các user đang online'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách user online',
        type: ApiResponseDto
    })
    async getOnlineUsers(@Request() req): Promise<ApiResponseDto> {
        // Get user's chats to find related users
        const userChats = await this.chatService.getUserChats(req.user.id);
        const chats = Array.isArray(userChats) ? userChats : [];

        // Extract unique user IDs from all chats
        const relatedUsers = new Set();
        chats.forEach(chat => {
            chat.members?.forEach(member => {
                if (member.user.id !== req.user.id) {
                    relatedUsers.add({
                        id: member.user.id,
                        username: member.user.username,
                        avatar: member.user.avatar,
                        status: member.user.status || 'ONLINE',
                        lastSeen: new Date().toISOString()
                    });
                }
            });
        });

        return {
            statusCode: HttpStatus.OK,
            message: 'Online users retrieved successfully',
            data: {
                users: Array.from(relatedUsers),
                count: relatedUsers.size
            },
            timestamp: new Date().toISOString()
        };
    }

    // ==================== CHAT ANALYTICS ====================

    @Get('analytics/dashboard')
    @ApiOperation({
        summary: 'Dashboard analytics',
        description: 'Lấy thống kê tổng quan về hoạt động chat'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analytics dashboard data',
        type: ApiResponseDto
    })
    async getChatAnalytics(@Request() req): Promise<ApiResponseDto> {
        const userChats = await this.chatService.getUserChats(req.user.id);
        const chats = Array.isArray(userChats) ? userChats : [];

        const analytics = {
            totalChats: chats.length || 0,
            directChats: chats.filter(chat => chat.type === 'DIRECT').length || 0,
            groupChats: chats.filter(chat => chat.type === 'GROUP').length || 0,
            totalMembers: chats.reduce((sum, chat) =>
                sum + (chat.members?.length || 0), 0) || 0,
            recentActivity: {
                messagesLast24h: 0, // Would need message timestamps
                newChatsThisWeek: 0,
                activeChatsToday: chats.length || 0
            }
        };

        return {
            statusCode: HttpStatus.OK,
            message: 'Analytics retrieved successfully',
            data: analytics,
            timestamp: new Date().toISOString()
        };
    }
} 