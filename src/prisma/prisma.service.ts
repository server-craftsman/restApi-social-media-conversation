import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: ['error', 'warn'],
        });
    }

    async onModuleInit() {
        try {
            this.logger.log('Connecting to database...');
            this.logger.log(`Using DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
            await this.$connect();
            this.logger.log('Database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Database disconnected');
        } catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }
} 