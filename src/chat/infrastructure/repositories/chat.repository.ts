import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatEntity } from '../../domain/entities/chat.entity';
import {
    ChatType,
    GroupType,
    GroupCategory,
    PaginationOptions,
    PaginationResult,
    SearchOptions
} from '../../domain/enums';

export interface CreateChatData {
    name?: string;
    description?: string;
    type: ChatType;
    groupType?: GroupType;
    category?: GroupCategory;
    isPublic?: boolean;
    allowAutoJoin?: boolean;
    tags?: string[];
    creatorId: string;
    memberIds: string[];
}

export interface UpdateChatData {
    name?: string;
    description?: string;
    avatar?: string;
    coverImage?: string;
    category?: GroupCategory;
    isPublic?: boolean;
    allowAutoJoin?: boolean;
    tags?: string[];
}

export interface ChatRepository {
    findById(id: string): Promise<ChatEntity | null>;
    findByIds(ids: string[]): Promise<ChatEntity[]>;
    findUserChats(userId: string, options?: PaginationOptions): Promise<PaginationResult<ChatEntity>>;
    findDirectChat(user1Id: string, user2Id: string): Promise<ChatEntity | null>;
    searchChats(searchOptions: SearchOptions, userId?: string): Promise<PaginationResult<ChatEntity>>;
    create(data: CreateChatData): Promise<ChatEntity>;
    update(id: string, data: UpdateChatData): Promise<ChatEntity>;
    delete(id: string): Promise<void>;
    addMember(chatId: string, userId: string, role?: string): Promise<void>;
    removeMember(chatId: string, userId: string): Promise<void>;
    updateMemberRole(chatId: string, userId: string, role: string): Promise<void>;
    getMemberCount(chatId: string): Promise<number>;
    isMember(chatId: string, userId: string): Promise<boolean>;
    updateLastMessage(chatId: string, messageId: string): Promise<void>;
}

@Injectable()
export class PrismaChatRepository implements ChatRepository {
    constructor(private prisma: PrismaService) { }

    async findById(id: string): Promise<ChatEntity | null> {
        const chat = await this.prisma.chat.findUnique({
            where: { id },
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
                settings: true,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return chat ? this.mapToDomain(chat) : null;
    }

    async findByIds(ids: string[]): Promise<ChatEntity[]> {
        const chats = await this.prisma.chat.findMany({
            where: { id: { in: ids } },
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
                settings: true,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return chats.map(chat => this.mapToDomain(chat));
    }

    async findUserChats(
        userId: string,
        options: PaginationOptions = { page: 1, limit: 20 }
    ): Promise<PaginationResult<ChatEntity>> {
        const { page, limit, sortBy = 'updatedAt', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;

        const [chats, total] = await Promise.all([
            this.prisma.chat.findMany({
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
                    lastMessage: {
                        select: {
                            id: true,
                            content: true,
                            type: true,
                            createdAt: true,
                            sender: {
                                select: {
                                    username: true
                                }
                            }
                        }
                    },
                    settings: true,
                    _count: {
                        select: {
                            members: true,
                            messages: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder }
            }),
            this.prisma.chat.count({
                where: {
                    members: {
                        some: {
                            userId
                        }
                    }
                }
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: chats.map(chat => this.mapToDomain(chat)),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    async findDirectChat(user1Id: string, user2Id: string): Promise<ChatEntity | null> {
        const chat = await this.prisma.chat.findFirst({
            where: {
                type: 'DIRECT',
                members: {
                    every: {
                        userId: { in: [user1Id, user2Id] }
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
                settings: true,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return chat ? this.mapToDomain(chat) : null;
    }

    async searchChats(
        searchOptions: SearchOptions,
        userId?: string
    ): Promise<PaginationResult<ChatEntity>> {
        const { query, page = 1, limit = 20, type, filters } = searchOptions;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            AND: [
                // Text search
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { tags: { hasSome: [query] } }
                    ]
                }
            ]
        };

        // Filter by type
        if (type === 'GROUPS') {
            whereClause.AND.push({ type: 'GROUP' });
        }

        // Filter by visibility (only show public groups or user's chats)
        if (userId) {
            whereClause.AND.push({
                OR: [
                    { isPublic: true },
                    {
                        members: {
                            some: {
                                userId
                            }
                        }
                    }
                ]
            });
        } else {
            whereClause.AND.push({ isPublic: true });
        }

        // Apply additional filters
        if (filters) {
            if (filters.category) {
                whereClause.AND.push({ category: filters.category });
            }
            if (filters.groupType) {
                whereClause.AND.push({ groupType: filters.groupType });
            }
        }

        const [chats, total] = await Promise.all([
            this.prisma.chat.findMany({
                where: whereClause,
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
                    settings: true,
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
            }),
            this.prisma.chat.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: chats.map(chat => this.mapToDomain(chat)),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    async create(data: CreateChatData): Promise<ChatEntity> {
        const { memberIds, creatorId, ...chatData } = data;

        // Ensure creator is in member list
        const allMemberIds = memberIds.includes(creatorId)
            ? memberIds
            : [creatorId, ...memberIds];

        const chat = await this.prisma.chat.create({
            data: {
                ...chatData,
                members: {
                    create: allMemberIds.map(memberId => ({
                        userId: memberId,
                        role: memberId === creatorId ? 'OWNER' : 'MEMBER'
                    }))
                },
                ...(data.type === 'GROUP' && {
                    settings: {
                        create: {
                            allowMemberInvite: true,
                            allowMemberPost: true,
                            moderationEnabled: data.isPublic || false,
                            slowModeDelay: 0,
                            joinApprovalRequired: !data.allowAutoJoin
                        }
                    }
                })
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
                settings: true,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return this.mapToDomain(chat);
    }

    async update(id: string, data: UpdateChatData): Promise<ChatEntity> {
        const chat = await this.prisma.chat.update({
            where: { id },
            data,
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
                settings: true,
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        return this.mapToDomain(chat);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.chat.delete({
            where: { id }
        });
    }

    async addMember(chatId: string, userId: string, role: string = 'MEMBER'): Promise<void> {
        await this.prisma.chatMember.upsert({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            create: {
                userId,
                chatId,
                role: role as any
            },
            update: {
                role: role as any
            }
        });
    }

    async removeMember(chatId: string, userId: string): Promise<void> {
        await this.prisma.chatMember.delete({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });
    }

    async updateMemberRole(chatId: string, userId: string, role: string): Promise<void> {
        await this.prisma.chatMember.update({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            },
            data: {
                role: role as any
            }
        });
    }

    async getMemberCount(chatId: string): Promise<number> {
        return this.prisma.chatMember.count({
            where: {
                chatId
            }
        });
    }

    async isMember(chatId: string, userId: string): Promise<boolean> {
        const member = await this.prisma.chatMember.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId
                }
            }
        });

        return !!member;
    }

    async updateLastMessage(chatId: string, messageId: string): Promise<void> {
        // Note: lastMessageId field doesn't exist in current schema
        // This would need to be implemented when the schema is updated
        console.log(`Would update last message for chat ${chatId} to ${messageId}`);
    }

    private mapToDomain(chat: any): ChatEntity {
        return new ChatEntity(
            chat.id,
            chat.name,
            chat.description,
            chat.avatar,
            chat.coverImage,
            chat.type,
            chat.groupType,
            chat.category,
            chat.isPublic,
            chat.allowAutoJoin,
            chat.tags,
            chat.lastMessageId,
            chat.createdAt,
            chat.updatedAt,
            chat.settings ? {
                allowMemberInvite: chat.settings.allowMemberInvite,
                allowMemberPost: chat.settings.allowMemberPost,
                moderationEnabled: chat.settings.moderationEnabled,
                slowModeDelay: chat.settings.slowModeDelay,
                maxMembers: chat.settings.maxMembers,
                joinApprovalRequired: chat.settings.joinApprovalRequired
            } : undefined,
            chat.members?.map((member: any) => ({
                id: member.id,
                userId: member.userId,
                role: member.role,
                joinedAt: member.joinedAt,
                leftAt: member.leftAt,
                isActive: true // Default to true since isActive doesn't exist in current schema
            })),
            {
                memberCount: chat._count?.members || 0,
                messageCount: chat._count?.messages || 0,
                activeMembers: chat.members?.length || 0,
                lastActivity: chat.updatedAt
            }
        );
    }
} 