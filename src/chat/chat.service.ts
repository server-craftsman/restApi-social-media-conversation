import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async createChat(createChatDto: CreateChatDto, userId: string) {
        const { name, memberIds } = createChatDto;

        // Add current user to members if not already included
        const allMemberIds = memberIds.includes(userId)
            ? memberIds
            : [...memberIds, userId];

        const chat = await this.prisma.chat.create({
            data: {
                name,
                type: allMemberIds.length > 2 ? 'GROUP' : 'DIRECT',
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
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return chats;
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
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });

        return messages.reverse();
    }

    async sendMessage(chatId: string, userId: string, sendMessageDto: SendMessageDto) {
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

        const message = await this.prisma.message.create({
            data: {
                content: sendMessageDto.content,
                type: sendMessageDto.type || 'TEXT',
                senderId: userId,
                chatId
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

        // Update chat's updatedAt
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
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

        // Check if user is member of this chat
        const isMember = message.chat.members.some(member => member.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: { isRead: true }
        });
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
                }
            }
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        // Check if user is member of this chat
        const isMember = chat.members.some(member => member.userId === userId);
        if (!isMember) {
            throw new ForbiddenException('You are not a member of this chat');
        }

        return chat;
    }
} 