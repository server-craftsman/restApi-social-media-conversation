import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'src/user/domain/interfaces/user.interface';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create sample users
    const users = [
        {
            email: 'admin@smartchat.com',
            username: 'admin_saygex6969',
            role: UserRole.ADMIN,
            password: await bcrypt.hash('admin123', 10),
            avatar: 'https://res.cloudinary.com/dsqbxgh88/image/upload/v1749810551/instagram-1749257505056_lehfdl.jpg',
            status: UserStatus.ONLINE,
            isVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            firstName: 'Admin',
            lastName: 'SmartChat',
            fullName: 'Admin SmartChat',
            dateOfBirth: new Date(),
            bio: 'I am the admin of SmartChat',
            location: 'Thu Duc, HCM, Vietnam',
            website: 'https://smartchat.com',
        }
    ];

    console.log('👥 Creating users...');
    const createdUsers: any[] = [];
    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: userData,
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username}`);
    }

    // Create sample chats
    console.log('💬 Creating chats...');

    // Direct chat between admin and john
    const directChat = await prisma.chat.create({
        data: {
            type: 'DIRECT',
            members: {
                create: [
                    { userId: createdUsers[0].id, role: 'ADMIN' },
                    { userId: createdUsers[1].id, role: 'MEMBER' },
                ],
            },
        },
    });

    // Group chat
    const groupChat = await prisma.chat.create({
        data: {
            name: 'Nhóm bạn thân',
            type: 'GROUP',
            members: {
                create: [
                    { userId: createdUsers[0].id, role: 'ADMIN' },
                    { userId: createdUsers[1].id, role: 'MEMBER' },
                    { userId: createdUsers[2].id, role: 'MEMBER' },
                    { userId: createdUsers[3].id, role: 'MEMBER' },
                ],
            },
        },
    });

    console.log(`✅ Created ${directChat.type} chat`);
    console.log(`✅ Created ${groupChat.type} chat: ${groupChat.name}`);

    // Create sample messages
    console.log('💭 Creating messages...');

    const messages = [
        {
            content: 'Xin chào! Chào mừng bạn đến với SmartChat!',
            type: 'TEXT' as const,
            senderId: createdUsers[0].id,
            chatId: directChat.id,
        },
        {
            content: 'Cảm ơn! Rất vui được gặp bạn!',
            type: 'TEXT' as const,
            senderId: createdUsers[1].id,
            chatId: directChat.id,
        },
        {
            content: 'Chào mừng tất cả mọi người đến với nhóm!',
            type: 'TEXT' as const,
            senderId: createdUsers[0].id,
            chatId: groupChat.id,
        },
        {
            content: 'Chào mọi người! 👋',
            type: 'TEXT' as const,
            senderId: createdUsers[1].id,
            chatId: groupChat.id,
        },
        {
            content: 'Xin chào! Rất vui được tham gia nhóm!',
            type: 'TEXT' as const,
            senderId: createdUsers[2].id,
            chatId: groupChat.id,
        },
    ];

    for (const messageData of messages) {
        await prisma.message.create({
            data: messageData,
        });
    }

    console.log(`✅ Created ${messages.length} messages`);

    // Create sample AI chats
    console.log('🤖 Creating AI chats...');

    const aiChat = await prisma.aIChat.create({
        data: {
            userId: createdUsers[0].id,
            title: 'Hỗ trợ kỹ thuật',
            messages: {
                create: [
                    {
                        content: 'Xin chào! Tôi cần hỗ trợ về SmartChat',
                        role: 'USER' as const,
                    },
                    {
                        content: 'Xin chào! Tôi là AI assistant của SmartChat. Tôi có thể giúp gì cho bạn?',
                        role: 'ASSISTANT' as const,
                    },
                ],
            },
        },
    });

    console.log(`✅ Created AI chat: ${aiChat.title}`);

    console.log('🎉 Database seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Chats: 2 (1 direct, 1 group)`);
    console.log(`- Messages: ${messages.length}`);
    console.log(`- AI Chats: 1`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 