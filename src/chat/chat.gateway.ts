import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('WebSocket')
@WebSocketGateway({
    cors: {
        origin: "*",
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>(); // userId -> socketId

    constructor(private chatService: ChatService) { }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('join')
    @ApiOperation({
        summary: 'User tham gia hệ thống',
        description: 'Khi user đăng nhập, gọi event này để cập nhật trạng thái online',
    })
    handleJoin(
        @MessageBody() data: { userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId } = data;
        this.connectedUsers.set(userId, client.id);
        client.join(`user_${userId}`);
        console.log(`User ${userId} joined`);

        // Emit user online status to all connected clients
        this.server.emit('userStatus', {
            userId,
            status: 'ONLINE'
        });
    }

    @SubscribeMessage('leave')
    @ApiOperation({
        summary: 'User rời khỏi hệ thống',
        description: 'Khi user đăng xuất, gọi event này để cập nhật trạng thái offline',
    })
    handleLeave(
        @MessageBody() data: { userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId } = data;
        this.connectedUsers.delete(userId);
        client.leave(`user_${userId}`);
        console.log(`User ${userId} left`);

        // Emit user offline status
        this.server.emit('userStatus', {
            userId,
            status: 'OFFLINE'
        });
    }

    @SubscribeMessage('joinChat')
    @ApiOperation({
        summary: 'Tham gia chat room',
        description: 'Khi user mở một chat, gọi event này để nhận tin nhắn real-time',
    })
    handleJoinChat(
        @MessageBody() data: { chatId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId } = data;
        client.join(`chat_${chatId}`);
        console.log(`Client joined chat: ${chatId}`);
    }

    @SubscribeMessage('leaveChat')
    @ApiOperation({
        summary: 'Rời khỏi chat room',
        description: 'Khi user đóng chat, gọi event này để ngừng nhận tin nhắn',
    })
    handleLeaveChat(
        @MessageBody() data: { chatId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId } = data;
        client.leave(`chat_${chatId}`);
        console.log(`Client left chat: ${chatId}`);
    }

    @SubscribeMessage('sendMessage')
    @ApiOperation({
        summary: 'Gửi tin nhắn real-time',
        description: 'Gửi tin nhắn mới và broadcast cho tất cả thành viên trong chat',
    })
    async handleSendMessage(
        @MessageBody() data: { chatId: string; userId: string; message: SendMessageDto },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId, userId, message } = data;

        try {
            const savedMessage = await this.chatService.sendMessage(chatId, userId, message);

            // Emit message to all users in the chat
            this.server.to(`chat_${chatId}`).emit('newMessage', {
                chatId,
                message: savedMessage
            });

            // Emit typing indicator stop
            this.server.to(`chat_${chatId}`).emit('typingStop', {
                chatId,
                userId
            });

        } catch (error) {
            client.emit('error', {
                message: 'Failed to send message',
                error: error.message
            });
        }
    }

    @SubscribeMessage('typing')
    @ApiOperation({
        summary: 'Bắt đầu typing indicator',
        description: 'Gửi signal cho biết user đang gõ tin nhắn',
    })
    handleTyping(
        @MessageBody() data: { chatId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId, userId } = data;

        // Emit typing indicator to all users in the chat except sender
        client.to(`chat_${chatId}`).emit('typing', {
            chatId,
            userId
        });
    }

    @SubscribeMessage('stopTyping')
    @ApiOperation({
        summary: 'Dừng typing indicator',
        description: 'Gửi signal cho biết user đã dừng gõ tin nhắn',
    })
    handleStopTyping(
        @MessageBody() data: { chatId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { chatId, userId } = data;

        // Emit typing stop indicator
        client.to(`chat_${chatId}`).emit('typingStop', {
            chatId,
            userId
        });
    }

    @SubscribeMessage('markAsRead')
    @ApiOperation({
        summary: 'Đánh dấu tin nhắn đã đọc',
        description: 'Cập nhật trạng thái đã đọc cho tin nhắn',
    })
    async handleMarkAsRead(
        @MessageBody() data: { messageId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { messageId, userId } = data;

        try {
            await this.chatService.markMessageAsRead(messageId, userId);

            // Emit read receipt
            this.server.emit('messageRead', {
                messageId,
                userId
            });

        } catch (error) {
            client.emit('error', {
                message: 'Failed to mark message as read',
                error: error.message
            });
        }
    }

    // Method to send message to specific user
    sendToUser(userId: string, event: string, data: any) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit(event, data);
        }
    }

    // Method to send message to all users in a chat
    sendToChat(chatId: string, event: string, data: any) {
        this.server.to(`chat_${chatId}`).emit(event, data);
    }
} 