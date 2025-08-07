import {
    ChatType,
    GroupType,
    GroupCategory
} from '../enums';

export interface ChatSettings {
    allowMemberInvite: boolean;
    allowMemberPost: boolean;
    moderationEnabled: boolean;
    slowModeDelay: number;
    maxMembers?: number;
    joinApprovalRequired: boolean;
}

export interface ChatMember {
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
}

export interface ChatStats {
    memberCount: number;
    messageCount: number;
    activeMembers: number;
    lastActivity: Date;
}

export class ChatEntity {
    constructor(
        public readonly id: string,
        public readonly name: string | null,
        public readonly description: string | null,
        public readonly avatar: string | null,
        public readonly coverImage: string | null,
        public readonly type: ChatType,
        public readonly groupType: GroupType | null,
        public readonly category: GroupCategory,
        public readonly isPublic: boolean,
        public readonly allowAutoJoin: boolean,
        public readonly tags: string[],
        public readonly lastMessageId: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly settings?: ChatSettings,
        public readonly members?: ChatMember[],
        public readonly stats?: ChatStats
    ) { }

    // Domain methods
    isGroup(): boolean {
        return this.type === ChatType.GROUP;
    }

    isDirect(): boolean {
        return this.type === ChatType.DIRECT;
    }

    isPublicGroup(): boolean {
        return this.isGroup() && this.isPublic;
    }

    isPrivateGroup(): boolean {
        return this.isGroup() && !this.isPublic;
    }

    isSecretGroup(): boolean {
        return this.groupType === GroupType.SECRET;
    }

    canUserJoin(userId: string): boolean {
        if (this.isDirect()) return false;
        if (this.isSecretGroup()) return false;
        if (this.isPublicGroup() && this.allowAutoJoin) return true;
        return false;
    }

    isMember(userId: string): boolean {
        return this.members?.some(member =>
            member.userId === userId && member.isActive
        ) ?? false;
    }

    getMember(userId: string): ChatMember | undefined {
        return this.members?.find(member =>
            member.userId === userId && member.isActive
        );
    }

    isOwner(userId: string): boolean {
        const member = this.getMember(userId);
        return member?.role === 'OWNER';
    }

    isAdmin(userId: string): boolean {
        const member = this.getMember(userId);
        return member?.role === 'ADMIN' || member?.role === 'OWNER';
    }

    isModerator(userId: string): boolean {
        const member = this.getMember(userId);
        return ['OWNER', 'ADMIN', 'MODERATOR'].includes(member?.role ?? '');
    }

    canUserInvite(userId: string): boolean {
        if (!this.settings?.allowMemberInvite) return false;
        return this.isModerator(userId);
    }

    canUserPost(userId: string): boolean {
        if (!this.settings?.allowMemberPost) return this.isModerator(userId);
        return this.isMember(userId);
    }

    getMemberCount(): number {
        return this.members?.filter(m => m.isActive).length ?? 0;
    }

    getActiveAdmins(): ChatMember[] {
        return this.members?.filter(m =>
            m.isActive && ['OWNER', 'ADMIN'].includes(m.role)
        ) ?? [];
    }

    hasTag(tag: string): boolean {
        return this.tags.includes(tag.toLowerCase());
    }

    matchesSearchQuery(query: string): boolean {
        const searchTerm = query.toLowerCase();

        return (
            this.name?.toLowerCase().includes(searchTerm) ||
            this.description?.toLowerCase().includes(searchTerm) ||
            this.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Business rules validation
    validateMemberLimit(): boolean {
        if (!this.settings?.maxMembers) return true;
        return this.getMemberCount() < this.settings.maxMembers;
    }

    validateGroupSettings(): string[] {
        const errors: string[] = [];

        if (this.isGroup() && !this.name) {
            errors.push('Group chat must have a name');
        }

        if (this.isGroup() && this.getMemberCount() < 2) {
            errors.push('Group chat must have at least 2 members');
        }

        if (this.isDirect() && this.getMemberCount() > 2) {
            errors.push('Direct chat cannot have more than 2 members');
        }

        if (this.settings?.slowModeDelay && this.settings.slowModeDelay < 0) {
            errors.push('Slow mode delay cannot be negative');
        }

        return errors;
    }

    // Static factory methods
    static createDirectChat(user1Id: string, user2Id: string): {
        name: string | null;
        description: string | null;
        avatar: string | null;
        coverImage: string | null;
        type: ChatType;
        groupType: GroupType | null;
        category: GroupCategory;
        isPublic: boolean;
        allowAutoJoin: boolean;
        tags: string[];
        lastMessageId: string | null;
        members: ChatMember[];
    } {
        return {
            name: null,
            description: null,
            avatar: null,
            coverImage: null,
            type: ChatType.DIRECT,
            groupType: null,
            category: GroupCategory.GENERAL,
            isPublic: false,
            allowAutoJoin: false,
            tags: [],
            lastMessageId: null,
            members: [
                {
                    id: '', // Will be set by infrastructure
                    userId: user1Id,
                    role: 'MEMBER',
                    joinedAt: new Date(),
                    isActive: true
                },
                {
                    id: '', // Will be set by infrastructure
                    userId: user2Id,
                    role: 'MEMBER',
                    joinedAt: new Date(),
                    isActive: true
                }
            ]
        };
    }

    static createGroup(params: {
        name: string;
        description?: string;
        groupType: GroupType;
        category: GroupCategory;
        isPublic: boolean;
        allowAutoJoin: boolean;
        tags: string[];
        creatorId: string;
        memberIds: string[];
    }): {
        name: string;
        description: string | null;
        avatar: string | null;
        coverImage: string | null;
        type: ChatType;
        groupType: GroupType;
        category: GroupCategory;
        isPublic: boolean;
        allowAutoJoin: boolean;
        tags: string[];
        lastMessageId: string | null;
        members: ChatMember[];
        settings: ChatSettings;
    } {
        const allMemberIds = params.memberIds.includes(params.creatorId)
            ? params.memberIds
            : [params.creatorId, ...params.memberIds];

        return {
            name: params.name,
            description: params.description || null,
            avatar: null,
            coverImage: null,
            type: ChatType.GROUP,
            groupType: params.groupType,
            category: params.category,
            isPublic: params.isPublic,
            allowAutoJoin: params.allowAutoJoin,
            tags: params.tags,
            lastMessageId: null,
            members: allMemberIds.map(memberId => ({
                id: '', // Will be set by infrastructure
                userId: memberId,
                role: memberId === params.creatorId ? 'OWNER' : 'MEMBER',
                joinedAt: new Date(),
                isActive: true
            })),
            settings: {
                allowMemberInvite: true,
                allowMemberPost: true,
                moderationEnabled: params.isPublic,
                slowModeDelay: 0,
                joinApprovalRequired: !params.allowAutoJoin
            }
        };
    }
} 