import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAIChatDto } from './dto/create-ai-chat.dto';
import { SendAIMessageDto } from './dto/send-ai-message.dto';

@Injectable()
export class AIChatService {
    constructor(private prisma: PrismaService) { }

    async createAIChat(userId: string, createAIChatDto: CreateAIChatDto) {
        const aiChat = await this.prisma.aIChat.create({
            data: {
                userId,
                title: createAIChatDto.title || 'New AI Chat'
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        return aiChat;
    }

    async getUserAIChats(userId: string) {
        const aiChats = await this.prisma.aIChat.findMany({
            where: {
                userId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return aiChats;
    }

    async getAIChatMessages(aiChatId: string, userId: string) {
        const aiChat = await this.prisma.aIChat.findUnique({
            where: {
                id: aiChatId,
                userId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!aiChat) {
            throw new NotFoundException('AI Chat not found');
        }

        return aiChat;
    }

    async sendAIMessage(aiChatId: string, userId: string, sendAIMessageDto: SendAIMessageDto) {
        // Verify user owns this AI chat
        const aiChat = await this.prisma.aIChat.findUnique({
            where: {
                id: aiChatId,
                userId
            }
        });

        if (!aiChat) {
            throw new NotFoundException('AI Chat not found');
        }

        // Save user message
        const userMessage = await this.prisma.aIMessage.create({
            data: {
                content: sendAIMessageDto.content,
                role: 'USER',
                aiChatId
            }
        });

        // Generate AI response
        const aiResponse = await this.generateAIResponse(sendAIMessageDto.content);

        // Save AI response
        const aiMessage = await this.prisma.aIMessage.create({
            data: {
                content: aiResponse,
                role: 'ASSISTANT',
                aiChatId
            }
        });

        // Update chat's updatedAt
        await this.prisma.aIChat.update({
            where: { id: aiChatId },
            data: { updatedAt: new Date() }
        });

        return {
            userMessage,
            aiMessage
        };
    }

    private async generateAIResponse(userMessage: string): Promise<string> {
        // Simple AI response logic - in production, integrate with OpenAI, Claude, etc.
        const responses = [
            "Tôi hiểu bạn đang nói về điều đó. Hãy cho tôi biết thêm chi tiết nhé!",
            "Đó là một câu hỏi thú vị. Tôi có thể giúp bạn tìm hiểu thêm về vấn đề này.",
            "Cảm ơn bạn đã chia sẻ. Tôi sẽ cố gắng hỗ trợ bạn tốt nhất có thể.",
            "Tôi thấy bạn đang quan tâm đến chủ đề này. Bạn có muốn tôi giải thích chi tiết hơn không?",
            "Đó là một ý kiến hay! Tôi có thể đưa ra một số gợi ý để cải thiện thêm."
        ];

        // Simple keyword-based response
        if (userMessage.toLowerCase().includes('xin chào') || userMessage.toLowerCase().includes('hello')) {
            return "Xin chào! Tôi là AI assistant của SmartChat. Tôi có thể giúp gì cho bạn hôm nay?";
        }

        if (userMessage.toLowerCase().includes('cảm ơn') || userMessage.toLowerCase().includes('thank')) {
            return "Không có gì! Tôi rất vui được giúp đỡ bạn. Bạn có câu hỏi gì khác không?";
        }

        if (userMessage.toLowerCase().includes('tạm biệt') || userMessage.toLowerCase().includes('goodbye')) {
            return "Tạm biệt! Hẹn gặp lại bạn. Chúc bạn một ngày tốt lành!";
        }

        // Return random response for other messages
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async deleteAIChat(aiChatId: string, userId: string) {
        const aiChat = await this.prisma.aIChat.findUnique({
            where: {
                id: aiChatId,
                userId
            }
        });

        if (!aiChat) {
            throw new NotFoundException('AI Chat not found');
        }

        await this.prisma.aIChat.delete({
            where: { id: aiChatId }
        });

        return { message: 'AI Chat deleted successfully' };
    }
} 