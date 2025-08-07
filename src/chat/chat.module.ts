import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SocialChatController } from './social-chat.controller';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';

// Infrastructure
import { PrismaChatRepository } from './infrastructure/repositories/chat.repository';

// Provide both the legacy interface and the new repository
const ChatRepositoryProvider = {
    provide: 'ChatRepository',
    useClass: PrismaChatRepository,
};

@Module({
    imports: [PrismaModule],
    controllers: [ChatController, SocialChatController],
    providers: [
        ChatService,
        ChatGateway,
        ChatRepositoryProvider,
        PrismaChatRepository
    ],
    exports: [
        ChatService,
        ChatGateway,
        'ChatRepository',
        PrismaChatRepository
    ],
})
export class ChatModule { } 