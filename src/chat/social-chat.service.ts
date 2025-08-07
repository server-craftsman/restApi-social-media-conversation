import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendEnhancedMessageDto, ReactToMessageDto, CreatePollDto } from './dto/enhanced-message.dto';
import {
    SendFriendRequestDto,
    RespondFriendRequestDto,
    CreateStoryDto,
    JoinGroupDto,
    SearchDto,
} from './dto/social-features.dto';
import { GroupType, FriendRequestStatus } from './domain/enums';

@Injectable()
export class SocialChatService {
    constructor(private prisma: PrismaService) { }

    // ==================== GROUP MANAGEMENT ====================

    async createGroup(createGroupDto: CreateGroupDto, creatorId: string) {
        const {
            name, description, avatar, coverImage, type, category,
            allowAutoJoin, initialMemberIds = [], tags = []
        } = createGroupDto;

        // Add creator to members if not included
        const allMemberIds = initialMemberIds.includes(creatorId)
            ? initialMemberIds
            : [creatorId, ...initialMemberIds];

        const group = await this.prisma.chat.create({
            data: {
                name,
                description,
                avatar,
                coverImage,
                type: 'GROUP',
                groupType: type,
                category,
                allowAutoJoin,
                tags,
                isPublic: type === GroupType.PUBLIC,
                members: {
                    create: allMemberIds.map(memberId => ({
                        userId: memberId,
                        role: memberId === creatorId ? 'ADMIN' : 'MEMBER',
                        joinedAt: new Date()
                    }))
                },
                settings: {
                    create: {
                        allowMemberInvite: true,
                        allowMemberPost: true,
                        moderationEnabled: type === GroupType.PUBLIC,
                        slowModeDelay: 0
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                                status: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return group;
    }

    async joinGroup(groupId: string, userId: string, joinDto: JoinGroupDto) {
        const group = await this.prisma.chat.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            throw new NotFoundException('Nhóm không tồn tại');
        }

        // Check if already a member
        const existingMember = group.members.find(m => m.userId === userId);
        if (existingMember) {
            throw new BadRequestException('Bạn đã là thành viên của nhóm này');
        }

        // Check group type and permissions
        if (group.groupType === GroupType.SECRET) {
            throw new ForbiddenException('Nhóm bí mật chỉ có thể tham gia qua lời mời');
        }

        if (group.allowAutoJoin || group.groupType === GroupType.PUBLIC) {
            // Auto join
            await this.prisma.chatMember.create({
                data: {
                    chatId: groupId,
                    userId,
                    role: 'MEMBER',
                    joinedAt: new Date()
                }
            });

            // Send system message
            await this.prisma.message.create({
                data: {
                    chatId: groupId,
                    senderId: userId,
                    content: joinDto.message || `đã tham gia nhóm`,
                    type: 'SYSTEM'
                }
            });

            return { status: 'joined', message: 'Đã tham gia nhóm thành công' };
        } else {
            // Create join request
            await this.prisma.groupJoinRequest.create({
                data: {
                    groupId,
                    userId,
                    message: joinDto.message,
                    status: 'PENDING'
                }
            });

            return { status: 'pending', message: 'Yêu cầu tham gia đã được gửi' };
        }
    }

    async searchGroups(searchDto: SearchDto, userId?: string) {
        const { query, limit = 20, page = 1 } = searchDto;
        const skip = (page - 1) * limit;

        const groups = await this.prisma.chat.findMany({
            where: {
                AND: [
                    { type: 'GROUP' },
                    {
                        OR: [
                            { groupType: GroupType.PUBLIC },
                            userId ? { members: { some: { userId } } } : {}
                        ]
                    },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { description: { contains: query, mode: 'insensitive' } },
                            { tags: { hasSome: [query] } }
                        ]
                    }
                ]
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: [
                { updatedAt: 'desc' }
            ]
        });

        const total = await this.prisma.chat.count({
            where: {
                type: 'GROUP',
                name: { contains: query, mode: 'insensitive' }
            }
        });

        return {
            groups,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ==================== ENHANCED MESSAGING ====================

    async sendEnhancedMessage(chatId: string, senderId: string, messageDto: SendEnhancedMessageDto) {
        // Verify membership
        const membership = await this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId: senderId
            }
        });

        if (!membership) {
            throw new ForbiddenException('Bạn không phải thành viên của chat này');
        }

        // Extract mentions and hashtags from content
        const mentionMatches = messageDto.content.match(/@(\w+)/g) || [];
        const hashtagMatches = messageDto.content.match(/#(\w+)/g) || [];

        const message = await this.prisma.message.create({
            data: {
                chatId,
                senderId,
                content: messageDto.content,
                type: messageDto.type || 'TEXT',
                mediaUrl: messageDto.mediaUrl,
                replyToMessageId: messageDto.replyToMessageId,
                metadata: messageDto.metadata,
                mentions: messageDto.mentionedUserIds || [],
                hashtags: hashtagMatches.map(tag => tag.slice(1)), // Remove #
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                replyToMessage: {
                    select: {
                        id: true,
                        content: true,
                        sender: {
                            select: {
                                username: true
                            }
                        }
                    }
                },
                reactions: true,
                _count: {
                    select: {
                        reactions: true
                    }
                }
            }
        });

        // Update chat last message
        await this.prisma.chat.update({
            where: { id: chatId },
            data: {
                lastMessageId: message.id,
                updatedAt: new Date()
            }
        });

        return message;
    }

    async reactToMessage(messageId: string, userId: string, reactionDto: ReactToMessageDto) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: { include: { members: true } } }
        });

        if (!message) {
            throw new NotFoundException('Tin nhắn không tồn tại');
        }

        // Verify membership
        const isMember = message.chat.members.some(m => m.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('Bạn không có quyền reaction tin nhắn này');
        }

        // Check if user already reacted
        const existingReaction = await this.prisma.messageReaction.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId
                }
            }
        });

        if (existingReaction) {
            if (existingReaction.type === reactionDto.reaction) {
                // Remove reaction if same type
                await this.prisma.messageReaction.delete({
                    where: {
                        messageId_userId: {
                            messageId,
                            userId
                        }
                    }
                });
                return { action: 'removed' };
            } else {
                // Update reaction type
                await this.prisma.messageReaction.update({
                    where: {
                        messageId_userId: {
                            messageId,
                            userId
                        }
                    },
                    data: {
                        type: reactionDto.reaction
                    }
                });
                return { action: 'updated' };
            }
        } else {
            // Create new reaction
            await this.prisma.messageReaction.create({
                data: {
                    messageId,
                    userId,
                    type: reactionDto.reaction
                }
            });
            return { action: 'added' };
        }
    }

    async createPoll(chatId: string, userId: string, pollDto: CreatePollDto) {
        const membership = await this.prisma.chatMember.findFirst({
            where: {
                chatId,
                userId
            }
        });

        if (!membership) {
            throw new ForbiddenException('Bạn không phải thành viên của chat này');
        }

        // TODO: Implement poll creation after running migration
        // const poll = await this.prisma.poll.create({
        //     data: {
        //         question: pollDto.question,
        //         options: pollDto.options,
        //         allowMultipleChoice: pollDto.allowMultipleChoice || false,
        //         expiresAt: pollDto.expiresAt ? new Date(pollDto.expiresAt) : null,
        //         creatorId: userId,
        //         message: {
        //             create: {
        //                 chatId,
        //                 senderId: userId,
        //                 content: `📊 **Poll:** ${pollDto.question}`,
        //                 type: 'TEXT' as any
        //             }
        //         }
        //     },
        //     include: {
        //         message: true,
        //         votes: true,
        //         _count: {
        //             select: {
        //                 votes: true
        //             }
        //         }
        //     }
        // });

        // return poll;

        // Temporary implementation - create a regular message
        const message = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content: `📊 **Poll:** ${pollDto.question}`,
                type: 'TEXT'
            }
        });

        return {
            id: 'temp-poll-id',
            question: pollDto.question,
            options: pollDto.options,
            message: message,
            votes: [],
            _count: { votes: 0 }
        };
    }

    // ==================== FRIEND REQUESTS ====================

    async sendFriendRequest(senderId: string, requestDto: SendFriendRequestDto) {
        const { userId, message } = requestDto;

        if (senderId === userId) {
            throw new BadRequestException('Không thể gửi lời mời kết bạn cho chính mình');
        }

        // Check if request already exists
        const existingRequest = await this.prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId: userId },
                    { senderId: userId, receiverId: senderId }
                ]
            }
        });

        if (existingRequest) {
            throw new BadRequestException('Lời mời kết bạn đã tồn tại');
        }

        // Check if already friends
        const existingFriendship = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: userId },
                    { userId, friendId: senderId }
                ]
            }
        });

        if (existingFriendship) {
            throw new BadRequestException('Đã là bạn bè');
        }

        const friendRequest = await this.prisma.friendRequest.create({
            data: {
                senderId,
                receiverId: userId,
                message,
                status: FriendRequestStatus.PENDING
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        return friendRequest;
    }

    async respondToFriendRequest(requestId: string, userId: string, responseDto: RespondFriendRequestDto) {
        const request = await this.prisma.friendRequest.findUnique({
            where: { id: requestId },
            include: {
                sender: true,
                receiver: true
            }
        });

        if (!request) {
            throw new NotFoundException('Lời mời kết bạn không tồn tại');
        }

        if (request.receiverId !== userId) {
            throw new ForbiddenException('Bạn không có quyền phản hồi lời mời này');
        }

        // Update request status
        await this.prisma.friendRequest.update({
            where: { id: requestId },
            data: {
                status: responseDto.response as FriendRequestStatus,
                respondedAt: new Date()
            }
        });

        if (responseDto.response === 'ACCEPTED') {
            // Create friendship
            await this.prisma.friendship.createMany({
                data: [
                    {
                        userId: request.senderId,
                        friendId: request.receiverId,
                        status: 'ACTIVE'
                    },
                    {
                        userId: request.receiverId,
                        friendId: request.senderId,
                        status: 'ACTIVE'
                    }
                ]
            });

            // Create direct chat if not exists
            const existingChat = await this.prisma.chat.findFirst({
                where: {
                    type: 'DIRECT',
                    members: {
                        every: {
                            userId: {
                                in: [request.senderId, request.receiverId]
                            }
                        }
                    }
                }
            });

            if (!existingChat) {
                await this.prisma.chat.create({
                    data: {
                        type: 'DIRECT',
                        members: {
                            create: [
                                { userId: request.senderId, role: 'MEMBER' },
                                { userId: request.receiverId, role: 'MEMBER' }
                            ]
                        }
                    }
                });
            }
        }

        return { status: 'success', action: responseDto.response };
    }

    // ==================== STORIES ====================

    async createStory(userId: string, storyDto: CreateStoryDto) {
        const story = await this.prisma.story.create({
            data: {
                userId,
                content: storyDto.content,
                mediaUrl: storyDto.mediaUrl,
                mediaType: storyDto.mediaType,
                allowReplies: storyDto.allowReplies || 'FRIENDS',
                expiresAt: new Date(Date.now() + (storyDto.autoDeleteAfterHours || 24) * 60 * 60 * 1000)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        views: true,
                        replies: true
                    }
                }
            }
        });

        return story;
    }

    async getStoriesForUser(userId: string) {
        // Get stories from friends and user's own stories
        const friendIds = await this.prisma.friendship.findMany({
            where: { userId },
            select: { friendId: true }
        });

        const stories = await this.prisma.story.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { userId },
                            { userId: { in: friendIds.map(f => f.friendId) } }
                        ]
                    },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        views: true,
                        replies: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return stories;
    }

    // ==================== SEARCH ====================

    async globalSearch(searchDto: SearchDto, userId?: string) {
        const { query, type, limit = 20, page = 1 } = searchDto;
        const skip = (page - 1) * limit;

        const results: any = {};

        if (type === 'ALL' || type === 'USERS') {
            results.users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                    status: true
                },
                skip: type === 'USERS' ? skip : 0,
                take: type === 'USERS' ? limit : 5
            });
        }

        if (type === 'ALL' || type === 'GROUPS') {
            results.groups = await this.searchGroups(
                { ...searchDto, type: 'GROUPS' },
                userId
            );
        }

        if (type === 'ALL' || type === 'MESSAGES') {
            // Search in user's chats only
            const userChats = await this.prisma.chatMember.findMany({
                where: { userId },
                select: { chatId: true }
            });

            results.messages = await this.prisma.message.findMany({
                where: {
                    AND: [
                        { chatId: { in: userChats.map(c => c.chatId) } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true
                        }
                    },
                    chat: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                },
                skip: type === 'MESSAGES' ? skip : 0,
                take: type === 'MESSAGES' ? limit : 5,
                orderBy: { createdAt: 'desc' }
            });
        }

        return results;
    }
} 