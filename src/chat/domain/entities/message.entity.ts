import { MessageType, ReactionType } from '../enums';

export interface MessageReaction {
    id: string;
    userId: string;
    type: ReactionType;
    createdAt: Date;
}

export interface MessageMention {
    id: string;
    userId: string;
    createdAt: Date;
}

export interface MessageMetadata {
    fileName?: string;
    fileSize?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    thumbnail?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    [key: string]: any;
}

export interface MessageReply {
    id: string;
    content: string;
    sender: {
        id: string;
        username: string;
        avatar?: string;
    };
    type: MessageType;
    createdAt: Date;
}

export class MessageEntity {
    constructor(
        public readonly id: string,
        public readonly content: string,
        public readonly type: MessageType,
        public readonly senderId: string,
        public readonly chatId: string,
        public readonly replyToMessageId: string | null,
        public readonly mediaUrl: string | null,
        public readonly metadata: MessageMetadata | null,
        public readonly mentions: string[],
        public readonly hashtags: string[],
        public readonly isRead: boolean,
        public readonly isEdited: boolean,
        public readonly isDeleted: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly reactions?: MessageReaction[],
        public readonly replyToMessage?: MessageReply,
        public readonly sender?: {
            id: string;
            username: string;
            avatar?: string;
        }
    ) { }

    // Domain methods
    isTextMessage(): boolean {
        return this.type === MessageType.TEXT;
    }

    isMediaMessage(): boolean {
        return [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.FILE].includes(this.type);
    }

    isSystemMessage(): boolean {
        return this.type === MessageType.SYSTEM;
    }

    isPollMessage(): boolean {
        return this.type === MessageType.POLL;
    }

    isReply(): boolean {
        return this.replyToMessageId !== null;
    }

    hasMentions(): boolean {
        return this.mentions.length > 0;
    }

    hasHashtags(): boolean {
        return this.hashtags.length > 0;
    }

    hasReactions(): boolean {
        return (this.reactions?.length ?? 0) > 0;
    }

    isMentioned(userId: string): boolean {
        return this.mentions.includes(userId);
    }

    getUserReaction(userId: string): MessageReaction | undefined {
        return this.reactions?.find(reaction => reaction.userId === userId);
    }

    getReactionCount(type?: ReactionType): number {
        if (!this.reactions) return 0;

        if (type) {
            return this.reactions.filter(r => r.type === type).length;
        }

        return this.reactions.length;
    }

    getReactionTypes(): ReactionType[] {
        if (!this.reactions) return [];

        const uniqueTypes = new Set(this.reactions.map(r => r.type));
        return Array.from(uniqueTypes);
    }

    getMentionedUsernames(): string[] {
        // Extract @mentions from content
        const mentionMatches = this.content.match(/@(\w+)/g) || [];
        return mentionMatches.map(mention => mention.slice(1)); // Remove @
    }

    getHashtagList(): string[] {
        return this.hashtags;
    }

    getMediaInfo(): { type: MessageType; url: string; metadata?: MessageMetadata } | null {
        if (!this.isMediaMessage() || !this.mediaUrl) return null;

        return {
            type: this.type,
            url: this.mediaUrl,
            metadata: this.metadata || undefined
        };
    }

    getPreviewText(maxLength: number = 100): string {
        if (this.isDeleted) return '(Message deleted)';
        if (this.isSystemMessage()) return this.content;
        if (this.isPollMessage()) return '📊 Poll';
        if (this.isMediaMessage()) {
            const typeMap = {
                [MessageType.IMAGE]: '🖼️ Image',
                [MessageType.VIDEO]: '🎥 Video',
                [MessageType.AUDIO]: '🎵 Audio',
                [MessageType.FILE]: '📎 File'
            };
            return typeMap[this.type] || '📎 Media';
        }

        const preview = this.content.substring(0, maxLength);
        return preview.length < this.content.length ? `${preview}...` : preview;
    }

    canBeEditedBy(userId: string): boolean {
        if (this.isDeleted || this.isSystemMessage()) return false;
        if (this.senderId !== userId) return false;

        // Allow editing within 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        return this.createdAt > fifteenMinutesAgo;
    }

    canBeDeletedBy(userId: string): boolean {
        if (this.isDeleted) return false;
        return this.senderId === userId;
    }

    // Business rules validation
    validateContent(): string[] {
        const errors: string[] = [];

        if (!this.content.trim() && !this.isMediaMessage()) {
            errors.push('Message content cannot be empty');
        }

        if (this.content.length > 5000) {
            errors.push('Message content too long (max 5000 characters)');
        }

        if (this.isMediaMessage() && !this.mediaUrl) {
            errors.push('Media message must have a media URL');
        }

        if (this.mentions.length > 50) {
            errors.push('Too many mentions (max 50)');
        }

        if (this.hashtags.length > 10) {
            errors.push('Too many hashtags (max 10)');
        }

        return errors;
    }

    // Static factory methods
    static createTextMessage(params: {
        content: string;
        senderId: string;
        chatId: string;
        replyToMessageId?: string;
        mentions?: string[];
        hashtags?: string[];
    }): {
        content: string;
        type: MessageType;
        senderId: string;
        chatId: string;
        replyToMessageId: string | null;
        mediaUrl: string | null;
        metadata: MessageMetadata | null;
        mentions: string[];
        hashtags: string[];
        isRead: boolean;
        isEdited: boolean;
        isDeleted: boolean;
    } {
        // Extract mentions and hashtags from content if not provided
        const extractedMentions = params.content.match(/@\w+/g)?.map(m => m.slice(1)) || [];
        const extractedHashtags = params.content.match(/#\w+/g)?.map(h => h.slice(1)) || [];

        return {
            content: params.content.trim(),
            type: MessageType.TEXT,
            senderId: params.senderId,
            chatId: params.chatId,
            replyToMessageId: params.replyToMessageId || null,
            mediaUrl: null,
            metadata: null,
            mentions: params.mentions || extractedMentions,
            hashtags: params.hashtags || extractedHashtags,
            isRead: false,
            isEdited: false,
            isDeleted: false
        };
    }

    static createMediaMessage(params: {
        content: string;
        type: MessageType.IMAGE | MessageType.VIDEO | MessageType.AUDIO | MessageType.FILE;
        senderId: string;
        chatId: string;
        mediaUrl: string;
        metadata?: MessageMetadata;
        replyToMessageId?: string;
    }): {
        content: string;
        type: MessageType;
        senderId: string;
        chatId: string;
        replyToMessageId: string | null;
        mediaUrl: string;
        metadata: MessageMetadata | null;
        mentions: string[];
        hashtags: string[];
        isRead: boolean;
        isEdited: boolean;
        isDeleted: boolean;
    } {
        return {
            content: params.content.trim(),
            type: params.type,
            senderId: params.senderId,
            chatId: params.chatId,
            replyToMessageId: params.replyToMessageId || null,
            mediaUrl: params.mediaUrl,
            metadata: params.metadata || null,
            mentions: [],
            hashtags: [],
            isRead: false,
            isEdited: false,
            isDeleted: false
        };
    }

    static createSystemMessage(params: {
        content: string;
        senderId: string;
        chatId: string;
    }): {
        content: string;
        type: MessageType;
        senderId: string;
        chatId: string;
        replyToMessageId: string | null;
        mediaUrl: string | null;
        metadata: MessageMetadata | null;
        mentions: string[];
        hashtags: string[];
        isRead: boolean;
        isEdited: boolean;
        isDeleted: boolean;
    } {
        return {
            content: params.content,
            type: MessageType.SYSTEM,
            senderId: params.senderId,
            chatId: params.chatId,
            replyToMessageId: null,
            mediaUrl: null,
            metadata: null,
            mentions: [],
            hashtags: [],
            isRead: false,
            isEdited: false,
            isDeleted: false
        };
    }
} 