import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatType, MessageType } from './domain/enums';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async createChat(createChatDto: CreateChatDto, userId: string) {
        const { name, memberIds, type = ChatType.DIRECT, description, avatar } = createChatDto;

        // Validate input
        if (type === ChatType.DIRECT && memberIds.length !== 1) {
            throw new BadRequestException('Direct chat must have exactly 1 other member');
        }

        if (type === ChatType.GROUP && !name) {
            throw new BadRequestException('Group chat must have a name');
        }

        if (type === ChatType.GROUP && memberIds.length < 1) {
            throw new BadRequestException('Group chat must have at least 1 other member');
        }

        // Add current user to members if not already included
        const allMemberIds = memberIds.includes(userId)
            ? memberIds
            : [...memberIds, userId];

        // Check if direct chat already exists
        if (type === ChatType.DIRECT) {
            const existingChat = await this.prisma.chat.findFirst({
                where: {
                    type: ChatType.DIRECT,
                    members: {
                        every: {
                            userId: {
                                in: allMemberIds
                            }
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
                    }
                }
            });

            if (existingChat) {
                return existingChat;
            }
        }

        const chat = await this.prisma.chat.create({
            data: {
                name,
                description,
                avatar,
                type,
                members: {
                    create: allMemberIds.map(memberId => ({
                        userId: memberId,
                        role: memberId === userId ? 'ADMIN' : 'MEMBER'
                    }))
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
                }
            }
        });

        return chat;
    }

    async getUserChats(userId: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                members: {
                    some: {
                        userId
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
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true,
                        members: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Add unread count for each chat
        const chatsWithUnreadCount = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await this.prisma.message.count({
                    where: {
                        chatId: chat.id,
                        senderId: { not: userId },
                        isRead: false
                    }
                });

                return {
                    ...chat,
                    unreadCount
                };
            })
        );

        return chatsWithUnreadCount;
    }

    async getChatById(chatId: string, userId: string) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
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
                        messages: true,
                        members: true
                    }
                }
            }
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Check if user is member
        const isMember = chat.members.some(member => member.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        return chat;
    }

    async getChatMessages(chatId: string, userId: string, limit = 50, offset = 0) {
        // Check if user is member of this chat
        const membership = await this.prisma.chatMember.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        const messages = await this.prisma.message.findMany({
            where: {
                chatId
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
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limit
        });

        const total = await this.prisma.message.count({
            where: { chatId }
        });

        // Mark messages as read
        await this.prisma.message.updateMany({
            where: {
                chatId,
                senderId: { not: userId },
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        return {
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }

    async sendMessage(chatId: string, userId: string, sendMessageDto: SendMessageDto) {
        const { content, type = MessageType.TEXT, mediaUrl, replyToMessageId, metadata } = sendMessageDto;

        // Check if user is member of this chat
        const membership = await this.prisma.chatMember.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        // Validate reply message if provided
        if (replyToMessageId) {
            const replyMessage = await this.prisma.message.findUnique({
                where: {
                    id: replyToMessageId,
                    chatId
                }
            });

            if (!replyMessage) {
                throw new BadRequestException('Reply message not found');
            }
        }

        // Validate media URL for media types
        if (type !== MessageType.TEXT && !mediaUrl) {
            throw new BadRequestException('Media URL is required for media messages');
        }

        const message = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content,
                type,
                mediaUrl,
                replyToMessageId,
                metadata
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
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        // Update chat's last message and updatedAt
        await this.prisma.chat.update({
            where: { id: chatId },
            data: {
                lastMessageId: message.id,
                updatedAt: new Date()
            }
        });

        return message;
    }

    async markMessageAsRead(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                chat: {
                    include: {
                        members: true
                    }
                }
            }
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Check if user is member of the chat
        const isMember = message.chat.members.some(member => member.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        // Only mark as read if user is not the sender
        if (message.senderId !== userId) {
            await this.prisma.message.update({
                where: { id: messageId },
                data: { isRead: true }
            });
        }

        return { success: true };
    }

    async getUnreadCount(chatId: string, userId: string) {
        const count = await this.prisma.message.count({
            where: {
                chatId,
                senderId: { not: userId },
                isRead: false
            }
        });

        return { unreadCount: count };
    }

    async searchMessages(chatId: string, userId: string, query: string, limit = 20) {
        // Check if user is member of this chat
        const membership = await this.prisma.chatMember.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        const messages = await this.prisma.message.findMany({
            where: {
                chatId,
                content: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return messages;
    }
} 