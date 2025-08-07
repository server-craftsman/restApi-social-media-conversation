// ==================== CHAT ENUMS ====================

export enum ChatType {
    DIRECT = 'DIRECT',
    GROUP = 'GROUP'
}

export enum GroupType {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    SECRET = 'SECRET'
}

export enum GroupCategory {
    GENERAL = 'GENERAL',
    GAMING = 'GAMING',
    TECHNOLOGY = 'TECHNOLOGY',
    ENTERTAINMENT = 'ENTERTAINMENT',
    SPORTS = 'SPORTS',
    EDUCATION = 'EDUCATION',
    BUSINESS = 'BUSINESS',
    LIFESTYLE = 'LIFESTYLE'
}

export enum MemberRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    MEMBER = 'MEMBER'
}

// ==================== MESSAGE ENUMS ====================

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    FILE = 'FILE',
    STICKER = 'STICKER',
    GIF = 'GIF',
    LOCATION = 'LOCATION',
    POLL = 'POLL',
    SYSTEM = 'SYSTEM'
}

export enum ReactionType {
    LIKE = 'LIKE',
    LOVE = 'LOVE',
    HAHA = 'HAHA',
    WOW = 'WOW',
    SAD = 'SAD',
    ANGRY = 'ANGRY',
    CARE = 'CARE'
}

// ==================== SOCIAL ENUMS ====================

export enum FriendRequestStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    BLOCKED = 'BLOCKED'
}

export enum FriendshipStatus {
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED'
}

export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO'
}

export enum StoryReplyType {
    EVERYONE = 'EVERYONE',
    FRIENDS = 'FRIENDS',
    CLOSE_FRIENDS = 'CLOSE_FRIENDS',
    NO_ONE = 'NO_ONE'
}

export enum GroupJoinRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum ActivityType {
    ONLINE = 'ONLINE',
    TYPING = 'TYPING',
    RECORDING = 'RECORDING',
    UPLOADING = 'UPLOADING',
    PLAYING = 'PLAYING',
    LISTENING = 'LISTENING'
}

export enum StatusType {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    AWAY = 'AWAY',
    INVISIBLE = 'INVISIBLE',
    CUSTOM = 'CUSTOM'
}

export enum UserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY',
    BUSY = 'BUSY'
}

export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

// ==================== DOMAIN INTERFACES ====================

export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface SearchOptions extends PaginationOptions {
    query: string;
    type?: 'ALL' | 'USERS' | 'GROUPS' | 'MESSAGES';
    filters?: Record<string, any>;
}

export interface ChatPermissions {
    canView: boolean;
    canPost: boolean;
    canInvite: boolean;
    canKick: boolean;
    canBan: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageSettings: boolean;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    bio?: string;
    status: UserStatus;
    role: UserRole;
    isVerified: boolean;
    lastSeen?: Date;
}

// ==================== DOMAIN VALUE OBJECTS ====================

export class MessageContent {
    constructor(
        public readonly text: string,
        public readonly mentions: string[] = [],
        public readonly hashtags: string[] = []
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.text.trim() && this.mentions.length === 0) {
            throw new Error('Message content cannot be empty');
        }

        if (this.text.length > 5000) {
            throw new Error('Message content too long (max 5000 characters)');
        }

        if (this.mentions.length > 50) {
            throw new Error('Too many mentions (max 50)');
        }

        if (this.hashtags.length > 10) {
            throw new Error('Too many hashtags (max 10)');
        }
    }

    static fromText(text: string): MessageContent {
        // Extract mentions and hashtags
        const mentions = text.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
        const hashtags = text.match(/#(\w+)/g)?.map(h => h.slice(1)) || [];

        return new MessageContent(text, mentions, hashtags);
    }
}

export class ChatName {
    constructor(public readonly value: string) {
        this.validate();
    }

    private validate(): void {
        if (!this.value.trim()) {
            throw new Error('Chat name cannot be empty');
        }

        if (this.value.length > 100) {
            throw new Error('Chat name too long (max 100 characters)');
        }

        if (this.value.trim() !== this.value) {
            throw new Error('Chat name cannot start or end with whitespace');
        }
    }
}

export class MediaFile {
    constructor(
        public readonly url: string,
        public readonly type: MediaType,
        public readonly size?: number,
        public readonly metadata?: Record<string, any>
    ) {
        this.validate();
    }

    private validate(): void {
        try {
            new URL(this.url);
        } catch {
            throw new Error('Invalid media URL');
        }

        if (this.size && this.size > 100 * 1024 * 1024) { // 100MB
            throw new Error('File too large (max 100MB)');
        }
    }
}

// ==================== DOMAIN ERRORS ====================

export class DomainError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ChatNotFoundError extends DomainError {
    constructor(chatId: string) {
        super(`Chat with ID ${chatId} not found`, 'CHAT_NOT_FOUND');
    }
}

export class MessageNotFoundError extends DomainError {
    constructor(messageId: string) {
        super(`Message with ID ${messageId} not found`, 'MESSAGE_NOT_FOUND');
    }
}

export class InsufficientPermissionsError extends DomainError {
    constructor(action: string) {
        super(`Insufficient permissions to ${action}`, 'INSUFFICIENT_PERMISSIONS');
    }
}

export class ChatMemberNotFoundError extends DomainError {
    constructor(userId: string, chatId: string) {
        super(`User ${userId} is not a member of chat ${chatId}`, 'MEMBER_NOT_FOUND');
    }
}

export class InvalidMessageTypeError extends DomainError {
    constructor(type: string) {
        super(`Invalid message type: ${type}`, 'INVALID_MESSAGE_TYPE');
    }
}

export class DuplicateFriendRequestError extends DomainError {
    constructor() {
        super('Friend request already exists', 'DUPLICATE_FRIEND_REQUEST');
    }
}

export class UserAlreadyFriendsError extends DomainError {
    constructor() {
        super('Users are already friends', 'ALREADY_FRIENDS');
    }
}

export class ChatFullError extends DomainError {
    constructor(maxMembers: number) {
        super(`Chat is full (max ${maxMembers} members)`, 'CHAT_FULL');
    }
}

export class SlowModeActiveError extends DomainError {
    constructor(remainingTime: number) {
        super(`Slow mode active. Please wait ${remainingTime} seconds`, 'SLOW_MODE_ACTIVE');
    }
} 